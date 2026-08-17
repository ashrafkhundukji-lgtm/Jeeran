/**
 * Geo-notify: refreshes each wallet_members' saved pass with whatever
 * offers are currently active near their home_lat/home_lng.
 *
 * Two ways to trigger this:
 *  1. Event-driven — call notifyMembersNearBusiness() right when a campaign
 *     goes live, is toggled, or is edited (wired into
 *     src/app/api/campaigns/route.ts and src/app/api/campaigns/[id]/route.ts).
 *  2. Periodic sweep — call refreshAllMembers() on a schedule, to catch
 *     offers that changed bid/expired since last push. Wired up as
 *     src/app/api/cron/wallet-refresh/route.ts, daily (see vercel.json) —
 *     Vercel Hobby plan caps Cron Jobs at once/day, otherwise this would run
 *     more often (every few hours) since (1) alone won't catch everything
 *     (e.g. an offer's end_date lapsing with no activate/deactivate event).
 *
 * Both call the same per-member patch, so start with (1) — it's cheaper —
 * and (2) is the safety net for what (1) can't see.
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
  // {offer_id: offer's campaigns.updated_at at last push} — an offer_id-only
  // set (the original design) can't detect a same-offer content edit
  // (title/description wording, or a bid change too small to reorder
  // anyone's top-5); confirmed live that it silently left a customer's card
  // showing stale text after such an edit. See
  // supabase/migrations/20260817b_offer_content_versioning.sql.
  last_notified_offers: Record<string, string>
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
  await Promise.all((members as WalletMember[]).map(refreshMember))
}

/** Periodic sweep across every registered member. */
export async function refreshAllMembers() {
  const { data: members, error } = await supabaseAdmin
    .from('wallet_members')
    .select('id, google_object_id, home_lat, home_lng, push_radius_km, last_notified_offers')
    .not('google_object_id', 'is', null)

  if (error) throw error
  await Promise.all((members as WalletMember[]).map(refreshMember))
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

async function refreshMember(member: WalletMember) {
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

  if (offerVersionsEqual(newVersions, oldVersions)) return // nothing changed -> skip the API call and the notification

  await patchMembershipObject(member.google_object_id, nearbyOffers)

  // Notify about whichever offer is actually new to this member (offer_id
  // wasn't in the previous version map at all — a content edit to an
  // already-seen offer still updates the card above, but isn't "new" enough
  // to re-notify about; that'd fire a notification on every wording tweak).
  // nearbyOffers is already ranked bid-desc/distance-asc, so the first match
  // is the highest-bid newly-appeared offer. Best-effort: Google caps this
  // at 3 notifies/24h per object, and a throttled/failed notify shouldn't
  // undo the card refresh that already succeeded.
  const newlyAppeared = nearbyOffers.find((o) => !(o.offer_id in oldVersions))
  if (newlyAppeared) {
    await notifyNewOffer(member.google_object_id, newlyAppeared).catch((err) => {
      console.error('notifyNewOffer failed', { memberId: member.id, offerId: newlyAppeared.offer_id, err })
    })
  }

  // Log reach: one row per unique (member, offer) ever notified, powering
  // the notified -> redeemed conversion-rate metric on the dashboards.
  // ignoreDuplicates makes this a no-op on repeat appearances in the top-5
  // list so it doesn't inflate reach counts or overwrite the original
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
