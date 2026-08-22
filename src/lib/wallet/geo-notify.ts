/**
 * Geo-notify: refreshes each wallet_members' saved pass with whatever
 * offers are currently active near their home_lat/home_lng.
 *
 * Card content and lock-screen notifications are deliberately DECOUPLED —
 * see supabase/migrations/20260820_notification_batching.sql for the full
 * rationale. At real scale (many shops, many daily offer changes), pinging
 * a customer's lock screen on every single qualifying change is an
 * uninstall risk; refreshing the card silently in the background is not.
 *
 *  - Card content (textModulesData/imageModulesData/linksModuleData/
 *    merchantLocations) still updates immediately and silently, via
 *    refreshMember() below, triggered either:
 *     1. Event-driven — notifyMembersNearBusiness(), called right when a
 *        campaign goes live, is toggled, or is edited (wired into
 *        src/app/api/campaigns/route.ts and
 *        src/app/api/campaigns/[id]/route.ts).
 *     2. Periodic sweep — refreshAllMembers(), catching anything (1) can't
 *        see (an offer's end_date lapsing with no activate/deactivate
 *        event, etc.). Wired into src/app/api/cron/wallet-refresh/route.ts.
 *     3. Re-engagement — a returning member's home_lat/home_lng being
 *        corrected on a fresh geolocation grant (src/app/api/wallet/
 *        membership/create/route.ts, the scan page's natural re-engagement
 *        point). Calls refreshMember() directly with { force: true } — see
 *        that option below for why this path can't use the same
 *        unchanged-offers early-out as (1)/(2).
 *  - The actual notification (Google's addMessage, messageType:
 *    TEXT_AND_NOTIFY — what makes it an Android lock-screen push, not just
 *    card text) is NOT sent by either of the above anymore. It's sent
 *    exclusively by sendDailyNotificationBatch(), a separate once-daily
 *    batch also wired into the wallet-refresh cron (reusing that cron's
 *    existing daily schedule rather than adding a second cron job — Vercel
 *    Hobby caps cron jobs, and there's no reason this needs its own
 *    schedule when "once a day, same fixed time" is exactly what's wanted).
 *    Capped at promotion_settings.max_daily_wallet_notifications (default
 *    3 — Google's own hard per-object/24h limit, not an arbitrary choice;
 *    see that column's comment for why it's configurable down to 1 later).
 */

import { supabaseAdmin } from '@/lib/supabase-admin'
import { patchMembershipObject, notifyNewOffer, type NearbyOffer } from './google-membership-pass'

interface WalletMember {
  id: string
  google_object_id: string | null
  // Signup-time seed + server-side push radius only — NOT the customer's
  // live position. The Wallet object's own `locations` field (set in
  // patchMembershipObject, see google-membership-pass.ts) is what delivers
  // ongoing "follows the customer" relevance now, via on-device OS
  // geofencing. See the column comment on wallet_members.home_lat.
  home_lat: number
  home_lng: number
  push_radius_km: number
  // {offer_id: offer's campaigns.updated_at at last CARD sync} — no longer
  // has anything to do with notifications (see the file-level comment
  // above); an offer_id-only set (the original design) can't detect a
  // same-offer content edit (title/description wording, or a bid change too
  // small to reorder anyone's top-5); confirmed live that it silently left a
  // customer's card showing stale text after such an edit. See
  // supabase/migrations/20260817b_offer_content_versioning.sql.
  last_notified_offers: Record<string, string>
}

interface NotifiableMember {
  id: string
  google_object_id: string | null
  home_lat: number
  home_lng: number
  push_radius_km: number
  // Same {offer_id: offer_updated_at} version-comparison technique as
  // WalletMember.last_notified_offers above, but a separate, independent
  // instance of it scoped to notification slots — see
  // supabase/migrations/20260820_notification_batching.sql.
  notified_offer_versions: Record<string, string>
}

/**
 * Call this when a new/updated campaign goes live at `businessLat/Lng`.
 * Finds members within a generous catchment radius and refreshes only
 * the ones whose offer list actually changed (avoids spamming updates).
 */
export async function notifyMembersNearBusiness(businessLat: number, businessLng: number) {
  // Pull members within a broad radius first (cheap bounding check via the
  // same geog column), then let nearby_active_offers do the precise
  // per-member distance filtering against their own push_radius_km.
  const { data: members, error } = await supabaseAdmin.rpc('members_within_radius', {
    p_lat: businessLat,
    p_lng: businessLng,
    p_radius_km: 20, // generous outer bound; per-member radius applied below
  })

  if (error) throw error
  await Promise.all((members as WalletMember[]).map((m) => refreshMember(m)))
}

/** Periodic sweep across every registered member. */
export async function refreshAllMembers() {
  const { data: members, error } = await supabaseAdmin
    .from('wallet_members')
    .select('id, google_object_id, home_lat, home_lng, push_radius_km, last_notified_offers')
    .not('google_object_id', 'is', null)

  if (error) throw error
  await Promise.all((members as WalletMember[]).map((m) => refreshMember(m)))
}

// Order-independent: don't rely on JSON.stringify key order (Postgres jsonb
// and JS object construction order aren't guaranteed to match between what
// was stored last time and what's freshly built here).
function offerVersionsEqual(a: Record<string, string>, b: Record<string, string>): boolean {
  const aKeys = Object.keys(a)
  const bKeys = Object.keys(b)
  if (aKeys.length !== bKeys.length) return false
  return aKeys.every((id) => a[id] === b[id])
}

export async function refreshMember(member: WalletMember, opts: { force?: boolean } = {}) {
  if (!member.google_object_id) return

  // Deliberately platform-wide: nearby_active_offers() ranks ANY registered
  // business's active campaigns within radius, not just the shop this
  // member originally scanned at. Don't filter by origin_business_id here.
  const { data: offers, error } = await supabaseAdmin.rpc('nearby_active_offers', {
    p_lat: member.home_lat,
    p_lng: member.home_lng,
    p_radius_km: member.push_radius_km,
    p_limit: 5,
  })
  if (error) throw error

  const nearbyOffers = (offers ?? []) as NearbyOffer[]
  const oldVersions = member.last_notified_offers ?? {}
  const newVersions: Record<string, string> = {}
  for (const o of nearbyOffers) newVersions[o.offer_id] = o.offer_updated_at

  // opts.force skips this early-out. It exists for the re-engagement caller
  // (see the file-level comment's item 3): a fresh geolocation grant can
  // leave the offer SET unchanged (same shops, offer_id/offer_updated_at
  // identical) while distance_km — baked into offersToTextModules()'s "X km"
  // text — has moved, since that's the entire point of the refresh:
  // correcting a stale displayed distance after home_lat/home_lng just
  // updated. offerVersionsEqual only compares offer_id/offer_updated_at, so
  // it can't see a distance-only change; force bypasses the check rather
  // than teaching the version map about distance too (which would also
  // defeat its purpose of avoiding no-op API calls for the event-driven and
  // periodic-sweep callers, where content — not distance — is what matters).
  if (!opts.force && offerVersionsEqual(newVersions, oldVersions)) return // nothing changed -> skip the API call

  // Card only — silent, immediate. No notifyNewOffer() call here anymore;
  // that's exclusively sendDailyNotificationBatch()'s job now (see the
  // file-level comment above). This is precisely the fix: an offer changing
  // used to fire an actual lock-screen push right here, every time.
  await patchMembershipObject(member.google_object_id, member.id, nearbyOffers)

  // Log reach: one row per unique (member, offer) ever shown on the card,
  // powering the reach -> redeemed conversion-rate metric on the
  // dashboards. Despite the table name, this is card-appearance reach, not
  // the lock-screen push batch below — pre-dates that distinction existing
  // at all. ignoreDuplicates makes this a no-op on repeat appearances in the
  // top-5 list so it doesn't inflate reach counts or overwrite the original
  // notified_at.
  if (nearbyOffers.length) {
    await supabaseAdmin.from('offer_notifications').upsert(
      nearbyOffers.map((o) => ({
        member_id: member.id,
        business_id: o.business_id,
        offer_id: o.offer_id,
      })),
      { onConflict: 'member_id,offer_id', ignoreDuplicates: true },
    )
  }

  await supabaseAdmin
    .from('wallet_members')
    .update({
      last_notified_offers: newVersions,
      last_notified_at: new Date().toISOString(),
    })
    .eq('id', member.id)
}

/**
 * The once-daily batched lock-screen notification job — the ONLY caller of
 * notifyNewOffer() anywhere in the app now. Wired into the same
 * wallet-refresh cron as refreshAllMembers() (src/app/api/cron/wallet-refresh/route.ts),
 * so it runs once a day at that cron's fixed schedule rather than needing a
 * second Vercel Cron job.
 *
 * Reads the cap from promotion_settings.max_daily_wallet_notifications
 * (default 3, Google's own hard per-object/24h limit — see that column's
 * migration comment) once per run, not once per member.
 */
export async function sendDailyNotificationBatch() {
  const { data: settings, error: settingsError } = await supabaseAdmin
    .from('promotion_settings')
    .select('max_daily_wallet_notifications')
    .limit(1)
    .maybeSingle()
  if (settingsError) throw settingsError
  const cap = settings?.max_daily_wallet_notifications ?? 3
  if (cap <= 0) return // admin has paused pushes entirely

  const { data: members, error } = await supabaseAdmin
    .from('wallet_members')
    .select('id, google_object_id, home_lat, home_lng, push_radius_km, notified_offer_versions')
    .not('google_object_id', 'is', null)
  if (error) throw error

  await Promise.all((members as NotifiableMember[]).map((m) => notifyMemberBatch(m, cap)))
}

async function notifyMemberBatch(member: NotifiableMember, cap: number) {
  if (!member.google_object_id) return

  // Deliberately platform-wide, same as refreshMember() — ranks ANY
  // registered business's active campaigns within radius, not just wherever
  // this member originally scanned.
  const { data: offers, error } = await supabaseAdmin.rpc('nearby_active_offers', {
    p_lat: member.home_lat,
    p_lng: member.home_lng,
    p_radius_km: member.push_radius_km,
    p_limit: 5,
  })
  if (error) throw error

  const nearbyOffers = (offers ?? []) as NearbyOffer[]
  const alreadyNotified = member.notified_offer_versions ?? {}

  // "New since last notification" — same {offer_id: offer_updated_at}
  // version-comparison technique offer-content-diffing already established
  // for the card (offerVersionsEqual/last_notified_offers above), just
  // checked against the separate notified_offer_versions tracker: an offer
  // only earns a slot if we've never sent a push for this exact version of
  // it before, so a re-edited offer can earn a fresh ping but an unchanged
  // one won't re-consume a slot on a later day.
  const candidates = nearbyOffers.filter((o) => alreadyNotified[o.offer_id] !== o.offer_updated_at)
  if (!candidates.length) return

  // nearby_active_offers() already returns its rows in ranked order
  // (bid-bucket -> tier tiebreak -> exact bid -> distance — see
  // supabase/migrations/20260818c_promotion_tier_tiebreaker.sql) — slicing
  // preserves that ordering rather than picking arbitrarily, so the 3 slots
  // go to the highest-ranked new offers, same priority the card itself uses.
  const toNotify = candidates.slice(0, cap)

  // Sequential, not Promise.all: these all hit the same object's addMessage
  // endpoint, and Google's 3/24h cap is per-object — no reason to race
  // several PATCHes against the same object concurrently.
  const sentVersions: Record<string, string> = {}
  for (const offer of toNotify) {
    try {
      await notifyNewOffer(member.google_object_id, offer)
      sentVersions[offer.offer_id] = offer.offer_updated_at
    } catch (err) {
      // Best-effort per offer: a failed send (e.g. transient error, or
      // Google's quota if something else somehow already sent to this
      // object today) doesn't mark that offer as notified, so it's
      // eligible to retry tomorrow — and doesn't stop the rest of this
      // member's batch from attempting.
      console.error('notifyNewOffer failed in daily batch', { memberId: member.id, offerId: offer.offer_id, err })
    }
  }
  if (!Object.keys(sentVersions).length) return

  await supabaseAdmin
    .from('wallet_members')
    .update({
      notified_offer_versions: { ...alreadyNotified, ...sentVersions },
      last_notification_batch_at: new Date().toISOString(),
    })
    .eq('id', member.id)
}
