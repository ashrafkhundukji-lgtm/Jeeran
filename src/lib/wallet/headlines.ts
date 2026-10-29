import type { NearbyOffer } from './google-membership-pass'

// ── Notification headline picker ─────────────────────────────────────────
// Pure (no I/O) so it can be tested on its own. Spec:
// docs/design/wallet-notification-headlines-spec.md. Per member, per send
// window, picks at most ONE headline shop plus up to two "also near you"
// names:
//   1. Intro: a shop whose first offer went live within newShopDays and
//      that this member has never been introduced to.
//   2. Otherwise a draw weighted by bid × freshness × distance — a higher
//      bid buys a larger SHARE of headlines, not the top spot every time.
//   3. Repeat limit: a shop can't headline for this member twice within
//      repeatDays unless its offer content changed since (and even then
//      not within MIN_REHEADLINE_DAYS).
// A member who already had a ping today only gets another one for a
// new-shop intro. (Allowing it for boosted offers too meant two pings every
// day in a busy area, where some shop has always just edited its offer.)
// pickForShop() applies the same rules to an Instant Notify send.

export interface Candidate extends NearbyOffer {
  bid_per_view: number
  content_changed_at: string
  business_first_offer_at: string
}

export interface MemberHistory {
  // Last time each shop was this member's headline (any kind).
  lastHeadlineAt: Map<string, Date>
  // Shops this member has already been introduced to.
  introduced: Set<string>
  // Pings this member already got today (Riyadh day), any kind.
  sentToday: number
}

export interface HeadlineSettings {
  boostFactor: number
  boostHours: number
  repeatDays: number
  newShopDays: number
  dailyBase: number
  dailyWithNews: number
}

export type HeadlineKind = 'intro' | 'draw'

export interface HeadlinePick {
  kind: HeadlineKind
  boosted: boolean
  headline: Candidate
  mentions: Candidate[]
}

const HOUR = 3_600_000
const DAY = 24 * HOUR
const MAX_MENTIONS = 2

// A shop can have more than one live offer; it competes once, with its
// highest-bid offer (most recently changed on a tie).
export function onePerShop(candidates: Candidate[]): Candidate[] {
  const best = new Map<string, Candidate>()
  for (const c of candidates) {
    const cur = best.get(c.business_id)
    if (
      !cur ||
      c.bid_per_view > cur.bid_per_view ||
      (c.bid_per_view === cur.bid_per_view && c.content_changed_at > cur.content_changed_at)
    ) {
      best.set(c.business_id, c)
    }
  }
  return [...best.values()]
}

export function isBoosted(c: Candidate, now: Date, s: HeadlineSettings): boolean {
  return now.getTime() - new Date(c.content_changed_at).getTime() < s.boostHours * HOUR
}

export function isNewShop(c: Candidate, now: Date, s: HeadlineSettings): boolean {
  return now.getTime() - new Date(c.business_first_offer_at).getTime() < s.newShopDays * DAY
}

// Closest shops count fully; one at the edge of the member's radius half.
function distanceFactor(c: Candidate, radiusKm: number): number {
  return 1 - 0.5 * Math.min(c.distance_km / Math.max(radiusKm, 0.1), 1)
}

export function weight(c: Candidate, now: Date, s: HeadlineSettings, radiusKm: number): number {
  return Math.max(c.bid_per_view, 1) * (isBoosted(c, now, s) ? s.boostFactor : 1) * distanceFactor(c, radiusKm)
}

// Even with a changed offer, a shop waits this long before headlining for
// the same member again — otherwise editing the offer every day would buy a
// daily headline.
const MIN_REHEADLINE_DAYS = 2

function passesRepeatLimit(c: Candidate, history: MemberHistory, now: Date, s: HeadlineSettings): boolean {
  const last = history.lastHeadlineAt.get(c.business_id)
  if (!last) return true
  const since = now.getTime() - last.getTime()
  if (since >= s.repeatDays * DAY) return true
  return since >= MIN_REHEADLINE_DAYS * DAY && new Date(c.content_changed_at) > last
}

function weightedDraw(pool: Candidate[], weights: number[], rng: () => number): Candidate {
  const total = weights.reduce((a, b) => a + b, 0)
  let r = rng() * total
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i]
    if (r < 0) return pool[i]
  }
  return pool[pool.length - 1]
}

export function pickHeadline(
  allCandidates: Candidate[],
  history: MemberHistory,
  s: HeadlineSettings,
  radiusKm: number,
  now: Date,
  rng: () => number = Math.random,
): HeadlinePick | null {
  if (history.sentToday >= Math.max(s.dailyBase, s.dailyWithNews)) return null
  const newsOnly = history.sentToday >= s.dailyBase

  const shops = onePerShop(allCandidates)
  const eligible = shops.filter((c) => passesRepeatLimit(c, history, now, s))

  let kind: HeadlineKind
  let pool = eligible.filter((c) => isNewShop(c, now, s) && !history.introduced.has(c.business_id))
  if (pool.length) {
    kind = 'intro'
  } else {
    if (newsOnly) return null
    kind = 'draw'
    pool = eligible
  }
  if (!pool.length) return null

  const headline = weightedDraw(
    pool,
    pool.map((c) => weight(c, now, s, radiusKm)),
    rng,
  )
  return { kind, boosted: isBoosted(headline, now, s), headline, mentions: mentionsFor(shops, headline) }
}

function mentionsFor(shops: Candidate[], headline: Candidate): Candidate[] {
  return shops
    .filter((c) => c.business_id !== headline.business_id)
    .sort((a, b) => b.bid_per_view - a.bid_per_view || a.distance_km - b.distance_km)
    .slice(0, MAX_MENTIONS)
}

// Instant Notify: same headline format as a window ping (this shop as the
// headline, the same "also near you" names), but NOT the window limits — no
// daily base limit and no repeat limit. What bounds it is the shared slot
// ledger (claim_notification_slot, max_daily_wallet_notifications = Google's
// 3 per card) and, in notifyInstantOffer(), never re-sending an unchanged
// offer. Null = this shop isn't an eligible candidate for the member.
export function pickForShop(
  allCandidates: Candidate[],
  businessId: string,
  history: MemberHistory,
  s: HeadlineSettings,
  now: Date,
): HeadlinePick | null {
  const shops = onePerShop(allCandidates)
  const headline = shops.find((c) => c.business_id === businessId)
  if (!headline) return null
  const intro = isNewShop(headline, now, s) && !history.introduced.has(businessId)
  return { kind: intro ? 'intro' : 'draw', boosted: isBoosted(headline, now, s), headline, mentions: mentionsFor(shops, headline) }
}
