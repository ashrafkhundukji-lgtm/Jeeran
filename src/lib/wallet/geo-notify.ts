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
 *    card text) is NOT sent by either of the above. It's sent by
 *    sendWindowNotifications(), run twice a day (12:30 and 19:30 Riyadh) by
 *    pg_cron via src/app/api/cron/wallet-notify/route.ts. Each ping has one
 *    HEADLINE shop plus up to two "also near you" names, picked by
 *    headlines.ts (new-shop intro → bid × freshness × distance draw, with a
 *    per-shop repeat limit). Spec: docs/design/
 *    wallet-notification-headlines-spec.md. Every ping is logged in
 *    notification_headlines (supabase/migrations/
 *    20261029_notification_headlines.sql), which drives the repeat limit,
 *    the one-time intro and the owner's "seen on lock screens" numbers.
 *    All sends share the per-day slot ledger (claim_notification_slot(),
 *    capped at promotion_settings.max_daily_wallet_notifications — Google's
 *    own hard 3 per object per 24h). The old 06:00 batch and its daily
 *    "same top offer" reminder are gone: a member with nothing worth a
 *    headline gets no ping.
 *  - Instant Notify add-on: a paid subscription (business_addons, addon_key
 *    'instant_notify' — see supabase/migrations/20260823_instant_notify_addon.sql)
 *    lets a business's own campaign skip the wait for the next send window and fire its
 *    push right away, via notifyInstantOffer() below, called from
 *    notifyMembersNearBusiness() alongside the existing silent card refresh.
 *    It shares the SAME per-day slot ledger (wallet_members.
 *    notifications_sent_date/notifications_sent_count, via
 *    claim_notification_slot()) that sendWindowNotifications() draws
 *    from, so an instant send reduces what's left for the windows rather
 *    than adding capacity beyond promotion_settings.max_daily_wallet_notifications.
 *    Each instant send is also logged as that shop's headline, so the
 *    windows' repeat limit counts it (the instant send itself isn't
 *    subject to that limit) and it counts toward the member's ping for
 *    the day.
 *    Does NOT change card content/ranking (nearby_active_offers() is
 *    untouched) — only which offers get an actual lock-screen push, and
 *    only for offers that already made this member's card (see
 *    notifyInstantOffer()).
 */

import { supabaseAdmin } from '@/lib/supabase-admin'
import { patchMembershipObject, notifyHeadline, type NearbyOffer } from './google-membership-pass'
import { pickForShop, pickHeadline, type Candidate, type HeadlineKind, type HeadlineSettings, type MemberHistory } from './headlines'
import { resolveOfferContent } from './offer-locale'
import { INSTANT_NOTIFY_ADDON_KEY } from '@/lib/billing/catalog'
import type { Locale } from '@/lib/i18n/locale'

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
  // Same {offer_id: offer_updated_at} technique as NotifiableMember.
  // notified_offer_versions below, populated here because
  // members_within_radius() (the RPC notifyMembersNearBusiness uses) does
  // `select *` off wallet_members — used by notifyInstantOffer() to apply
  // the exact same version-diff spam guard the send windows maintain, so a
  // paid instant-notify subscription can't re-fire for unchanged content.
  // Optional: refreshMember()'s other callers (e.g. src/app/api/wallet/
  // membership/create/route.ts) build a WalletMember literal without it —
  // refreshMember() itself never reads this field, only notifyInstantOffer()
  // does, which defaults it to {} when absent.
  notified_offer_versions?: Record<string, string>
  // wallet_members.preferred_language (supabase/migrations/
  // 20260829_wallet_preferred_language.sql) — a member's explicit override
  // of Google Wallet's own automatic per-viewer language detection. `null`/
  // absent (every caller that builds a WalletMember literal without
  // selecting this column, e.g. the re-engagement path in
  // src/app/api/wallet/membership/create/route.ts) means "no preference set
  // yet," which refreshMember() treats as "keep the existing auto-detect
  // behavior" — see google-membership-pass.ts's localized()/pick().
  preferred_language?: Locale | null
}

interface NotifiableMember {
  id: string
  google_object_id: string | null
  home_lat: number
  home_lng: number
  push_radius_km: number
  // Same {offer_id: offer_updated_at} map notifyInstantOffer() checks, so an
  // offer already pushed by a window isn't re-pushed by Instant Notify for
  // unchanged content.
  notified_offer_versions: Record<string, string>
  preferred_language: Locale | null
}

/**
 * Call this when a new/updated campaign goes live at `businessLat/Lng`.
 * Finds members within a generous catchment radius and refreshes only
 * the ones whose offer list actually changed (avoids spamming updates).
 *
 * `businessId` additionally drives the Instant Notify add-on check below —
 * card refresh (refreshMember) doesn't need it and stays exactly as before.
 */
export async function notifyMembersNearBusiness(businessLat: number, businessLng: number, businessId: string) {
  // Pull members within a broad radius first (cheap bounding check via the
  // same geog column), then let nearby_active_offers do the precise
  // per-member distance filtering against their own push_radius_km.
  const { data: members, error } = await supabaseAdmin.rpc('members_within_radius', {
    p_lat: businessLat,
    p_lng: businessLng,
    p_radius_km: 20, // generous outer bound; per-member radius applied below
  })

  if (error) throw error
  const memberList = members as WalletMember[]

  await Promise.all(memberList.map((m) => refreshMember(m)))

  // Instant Notify add-on: only reached if this business has an active
  // 'instant_notify' subscription (business_addons — see
  // supabase/migrations/20260823_instant_notify_addon.sql). One lookup here
  // rather than per-member since it's the same answer for every member in
  // this call. Best-effort, same posture as the rest of this pipeline: never
  // let this block the card refresh above, which already succeeded.
  const { data: addon, error: addonError } = await supabaseAdmin
    .from('business_addons')
    .select('is_active')
    .eq('business_id', businessId)
    .eq('addon_key', INSTANT_NOTIFY_ADDON_KEY)
    .maybeSingle()
  if (addonError) {
    console.error('notifyMembersNearBusiness: business_addons lookup failed', { businessId, err: addonError })
    return
  }
  if (!addon?.is_active) return

  let settings: NotifySettings
  try {
    settings = await loadNotifySettings()
  } catch (err) {
    console.error('notifyMembersNearBusiness: promotion_settings lookup failed', { businessId, err })
    return
  }
  if (settings.cap <= 0) return // admin has paused pushes entirely

  await Promise.all(
    memberList.map((m) =>
      notifyInstantOffer(m, businessId, settings).catch((err) => {
        console.error('notifyInstantOffer failed', { memberId: m.id, businessId, err })
      }),
    ),
  )
}

/**
 * Instant Notify add-on: fires an immediate lock-screen push for THIS
 * business's own offer to one member, ahead of the next send window. The
 * ping is a normal headline (notifyHeadline(): this shop as the headline,
 * plus the same "also near you" names). Limits: the shared slot ledger
 * (max_daily_wallet_notifications, Google's 3 per card) and no repeat of an
 * unchanged offer. The windows' daily base limit and 7-day repeat limit do
 * NOT apply — that immediacy is what the subscription buys.
 */
async function notifyInstantOffer(member: WalletMember, businessId: string, { cap, headline: settings }: NotifySettings) {
  if (!member.google_object_id) return

  // Independent recompute, same as refreshMember()
  // each doing their own — see this file's header comment on why that's the
  // existing, deliberate pattern rather than threading one result through.
  const { data: offers, error } = await supabaseAdmin.rpc('nearby_active_offers', {
    p_lat: member.home_lat,
    p_lng: member.home_lng,
    p_radius_km: member.push_radius_km,
    p_limit: 5,
  })
  if (error) throw error

  // Only ever THIS business's own offer — never lets an instant-notify
  // subscriber trigger a push for anyone else's campaign. This is also what
  // keeps card ranking untouched: if the offer isn't in this member's
  // nearby_active_offers() top-5 (out-bid, out of range, inactive), it isn't
  // on the card either, so it doesn't get an instant push — the add-on only
  // accelerates WHEN an already card-eligible offer notifies, never WHETHER
  // it's eligible.
  if (!((offers ?? []) as NearbyOffer[]).some((o) => o.business_id === businessId)) return

  // Never re-send an offer this member was already pinged about in this
  // exact version ({offer_id: offer_updated_at}, the same map the windows
  // write) — so toggling or re-saving unchanged content can't spend a slot.
  // This is the only per-offer guard: the windows' daily base limit and
  // 7-day repeat limit deliberately don't apply to Instant Notify.
  const alreadyNotified = member.notified_offer_versions ?? {}
  const own = ((offers ?? []) as NearbyOffer[]).find((o) => o.business_id === businessId)
  if (own && alreadyNotified[own.offer_id] === own.offer_updated_at) return

  const { data: candidates, error: candidatesError } = await supabaseAdmin.rpc('notification_candidates', {
    p_lat: member.home_lat,
    p_lng: member.home_lng,
    p_radius_km: member.push_radius_km,
  })
  if (candidatesError) throw candidatesError
  const now = new Date()
  const history = await loadMemberHistory(member.id, settings, now)
  const pick = pickForShop((candidates ?? []) as Candidate[], businessId, history, settings, now)
  if (!pick) return

  // Atomic claim against the SAME per-day ledger sendWindowNotifications() draws
  // from — whichever caller's claim lands first wins the slot
  // (first-come-first-served by claim timestamp, the confirmed
  // contention-resolution rule for multiple premium businesses competing for
  // the same member/day). A failed claim (today's cap already spent, by an
  // earlier instant send or an already-run batch) just leaves this offer
  // unconsumed — eligible again tomorrow, same as any offer that misses the
  // cap today.
  const { data: claimed, error: claimError } = await supabaseAdmin.rpc('claim_notification_slot', {
    p_member_id: member.id,
    p_cap: cap,
  })
  if (claimError) throw claimError
  if (!claimed) return

  try {
    const preferredLanguage = member.preferred_language ?? null
    const resolvedTitle = preferredLanguage
      ? (await resolveOfferContent([pick.headline], preferredLanguage)).get(pick.headline.offer_id)?.title
      : undefined
    await notifyHeadline(member.google_object_id, pick, preferredLanguage, resolvedTitle)
  } catch (err) {
    // Give the claimed slot back — a transient send failure shouldn't
    // permanently burn a slot from today's shared budget for nothing (see
    // release_notification_slot()'s own comment).
    try {
      await supabaseAdmin.rpc('release_notification_slot', { p_member_id: member.id })
    } catch {
      // best-effort
    }
    throw err
  }

  await supabaseAdmin
    .from('wallet_members')
    .update({
      notified_offer_versions: { ...(member.notified_offer_versions ?? {}), [pick.headline.offer_id]: pick.headline.offer_updated_at },
    })
    .eq('id', member.id)
  // An intro stays an intro whatever triggered it, so a window won't
  // introduce the same shop again.
  await recordHeadline(member.id, pick.headline, pick.kind === 'intro' ? 'intro' : 'instant', pick.mentions)
}

/** Periodic sweep across every registered member. */
export async function refreshAllMembers() {
  const { data: members, error } = await supabaseAdmin
    .from('wallet_members')
    .select('id, google_object_id, home_lat, home_lng, push_radius_km, last_notified_offers, preferred_language')
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
  // src/app/api/wallet/membership/language/route.ts uses force for the exact
  // same reason: a member changing preferred_language doesn't change the
  // offer SET either, just which language it's rendered in.
  if (!opts.force && offerVersionsEqual(newVersions, oldVersions)) return // nothing changed -> skip the API call

  // Card only — silent, immediate. No notifyNewOffer() call here anymore;
  // that's exclusively sendWindowNotifications()'s job now (see the
  // file-level comment above). This is precisely the fix: an offer changing
  // used to fire an actual lock-screen push right here, every time.
  await patchMembershipObject(member.google_object_id, member.id, nearbyOffers, member.preferred_language ?? null)

  // Log reach: one row per unique (member, offer) ever shown on the card,
  // powering the reach -> redeemed conversion-rate metric on the
  // dashboards. Despite the table name, this is card-appearance reach, not
  // the lock-screen pings (notification_headlines) — pre-dates that distinction existing
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

// ── Send windows (headline pings) ────────────────────────────────────────

export interface WindowSummary {
  dryRun: boolean
  members: number
  sent: { intro: number; draw: number }
  noPick: number
  capped: number
  failed: number
  // Headline counts per shop this run, with the shop's bid — what the
  // dry run is for: checking shares look right before going live.
  byShop: { business_id: string; business_name: string; bid_per_view: number; intro: number; draw: number }[]
}

// Riyadh is UTC+3 all year (no DST).
const RIYADH_OFFSET_MS = 3 * 3_600_000

function startOfRiyadhDay(now: Date): Date {
  const local = new Date(now.getTime() + RIYADH_OFFSET_MS)
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - RIYADH_OFFSET_MS)
}

// PostgREST returns at most 1000 rows per request; page through.
async function fetchAll<T>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const out: T[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await page(from, from + 999)
    if (error) throw error
    out.push(...(data ?? []))
    if (!data || data.length < 1000) return out
  }
}

// Bounded concurrency: each member costs a few round trips; firing all of
// them at once at scale would swamp the pool.
async function forEachLimit<T>(items: T[], limit: number, fn: (item: T) => Promise<void>) {
  let next = 0
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) await fn(items[next++])
    }),
  )
}

interface NotifySettings {
  cap: number
  headline: HeadlineSettings
}

interface HeadlineRow {
  business_id: string
  kind: string
  sent_at: string
}

const emptyHistory = (): MemberHistory => ({ lastHeadlineAt: new Map(), introduced: new Set(), sentToday: 0 })

// Intros only matter within newShopDays of a shop's first offer, so the
// same lookback as the repeat limit covers them.
function historySince(settings: HeadlineSettings, now: Date): string {
  const lookbackDays = Math.max(settings.repeatDays, settings.newShopDays) + 1
  return new Date(now.getTime() - lookbackDays * 86_400_000).toISOString()
}

function addToHistory(h: MemberHistory, r: HeadlineRow, dayStart: Date) {
  const at = new Date(r.sent_at)
  const prev = h.lastHeadlineAt.get(r.business_id)
  if (!prev || at > prev) h.lastHeadlineAt.set(r.business_id, at)
  if (r.kind === 'intro') h.introduced.add(r.business_id)
  if (at >= dayStart) h.sentToday++
}

// One member's history — for Instant Notify, which fires outside a window.
async function loadMemberHistory(memberId: string, settings: HeadlineSettings, now: Date): Promise<MemberHistory> {
  const { data, error } = await supabaseAdmin
    .from('notification_headlines')
    .select('business_id, kind, sent_at')
    .eq('member_id', memberId)
    .gte('sent_at', historySince(settings, now))
  if (error) throw error
  const h = emptyHistory()
  const dayStart = startOfRiyadhDay(now)
  for (const r of (data ?? []) as HeadlineRow[]) addToHistory(h, r, dayStart)
  return h
}

async function loadNotifySettings(): Promise<NotifySettings> {
  const { data, error } = await supabaseAdmin
    .from('promotion_settings')
    .select(
      'max_daily_wallet_notifications, notify_boost_factor, notify_boost_hours, notify_repeat_days, notify_new_shop_days, notify_daily_base, notify_daily_with_news',
    )
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return {
    cap: data?.max_daily_wallet_notifications ?? 3,
    headline: {
      boostFactor: Number(data?.notify_boost_factor ?? 3),
      boostHours: data?.notify_boost_hours ?? 48,
      repeatDays: data?.notify_repeat_days ?? 7,
      newShopDays: data?.notify_new_shop_days ?? 7,
      dailyBase: data?.notify_daily_base ?? 1,
      dailyWithNews: data?.notify_daily_with_news ?? 2,
    },
  }
}

async function recordHeadline(memberId: string, offer: NearbyOffer, kind: HeadlineKind | 'instant', mentions: NearbyOffer[]) {
  const { error } = await supabaseAdmin.from('notification_headlines').insert({
    member_id: memberId,
    business_id: offer.business_id,
    offer_id: offer.offer_id,
    kind,
    mentioned_business_ids: mentions.map((m) => m.business_id),
  })
  if (error) console.error('notification_headlines insert failed', { memberId, offerId: offer.offer_id, err: error })
}

/**
 * One send window: for every member with a saved pass, pick at most one
 * headline (headlines.ts) and send it. `dryRun` picks exactly the same way
 * but claims no slot, sends nothing and writes nothing — it only returns the
 * summary, so the spread per shop can be reviewed before going live.
 */
export async function sendWindowNotifications(opts: { dryRun?: boolean } = {}): Promise<WindowSummary> {
  const dryRun = Boolean(opts.dryRun)
  const now = new Date()
  const { cap, headline: settings } = await loadNotifySettings()
  const summary: WindowSummary = { dryRun, members: 0, sent: { intro: 0, draw: 0 }, noPick: 0, capped: 0, failed: 0, byShop: [] }
  if (cap <= 0) return summary // admin has paused pushes entirely

  const members = await fetchAll<NotifiableMember>((from, to) =>
    supabaseAdmin
      .from('wallet_members')
      .select('id, google_object_id, home_lat, home_lng, push_radius_km, notified_offer_versions, preferred_language')
      .not('google_object_id', 'is', null)
      .order('id')
      .range(from, to),
  )
  summary.members = members.length

  // Everyone's recent headlines in one pass.
  const since = historySince(settings, now)
  const rows = await fetchAll<HeadlineRow & { member_id: string }>((from, to) =>
    supabaseAdmin
      .from('notification_headlines')
      .select('member_id, business_id, kind, sent_at')
      .gte('sent_at', since)
      .order('id')
      .range(from, to),
  )
  const dayStart = startOfRiyadhDay(now)
  const histories = new Map<string, MemberHistory>()
  for (const r of rows) {
    let h = histories.get(r.member_id)
    if (!h) histories.set(r.member_id, (h = emptyHistory()))
    addToHistory(h, r, dayStart)
  }

  const byShop = new Map<string, WindowSummary['byShop'][number]>()

  await forEachLimit(members, 10, async (member) => {
    const objectId = member.google_object_id
    if (!objectId) return
    try {
      const { data, error } = await supabaseAdmin.rpc('notification_candidates', {
        p_lat: member.home_lat,
        p_lng: member.home_lng,
        p_radius_km: member.push_radius_km,
      })
      if (error) throw error
      const history = histories.get(member.id) ?? { lastHeadlineAt: new Map(), introduced: new Set<string>(), sentToday: 0 }
      const pick = pickHeadline((data ?? []) as Candidate[], history, settings, member.push_radius_km, now)
      if (!pick) {
        summary.noPick++
        return
      }

      if (!dryRun) {
        const { data: claimed, error: claimError } = await supabaseAdmin.rpc('claim_notification_slot', {
          p_member_id: member.id,
          p_cap: cap,
        })
        if (claimError) throw claimError
        if (!claimed) {
          summary.capped++
          return
        }
        try {
          const resolvedTitle = member.preferred_language
            ? (await resolveOfferContent([pick.headline], member.preferred_language)).get(pick.headline.offer_id)?.title
            : undefined
          await notifyHeadline(objectId, pick, member.preferred_language, resolvedTitle)
        } catch (err) {
          console.error('notifyHeadline failed', { memberId: member.id, offerId: pick.headline.offer_id, err })
          summary.failed++
          try {
            await supabaseAdmin.rpc('release_notification_slot', { p_member_id: member.id })
          } catch {
            // best-effort
          }
          return
        }
        await recordHeadline(member.id, pick.headline, pick.kind, pick.mentions)
        await supabaseAdmin
          .from('wallet_members')
          .update({
            notified_offer_versions: {
              ...(member.notified_offer_versions ?? {}),
              [pick.headline.offer_id]: pick.headline.offer_updated_at,
            },
            last_notification_batch_at: now.toISOString(),
          })
          .eq('id', member.id)
      }

      summary.sent[pick.kind]++
      const shop = byShop.get(pick.headline.business_id) ?? {
        business_id: pick.headline.business_id,
        business_name: pick.headline.business_name,
        bid_per_view: pick.headline.bid_per_view,
        intro: 0,
        draw: 0,
      }
      shop[pick.kind]++
      byShop.set(pick.headline.business_id, shop)
    } catch (err) {
      console.error('sendWindowNotifications: member failed', { memberId: member.id, err })
      summary.failed++
    }
  })

  summary.byShop = [...byShop.values()].sort((a, b) => b.intro + b.draw - (a.intro + a.draw))
  return summary
}
