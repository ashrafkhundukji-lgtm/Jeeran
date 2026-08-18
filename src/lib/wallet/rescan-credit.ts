/**
 * Rescan-credit: a third, distinct credit-earning event alongside the
 * one-time signup bonus (pay_signup_bonus, paid only on brand-new member
 * creation) and redemption credit (claim_ad_credit_transaction_membership,
 * paid when a customer actually redeems an offer). This one fires every
 * time an EXISTING member scans a QR stand — separate amounts, separate
 * logic, don't conflate with either.
 *
 * Two credit line items per qualifying scan:
 *   - RESCAN_CREDIT to the business whose QR was just scanned.
 *   - ORIGIN_RESCAN_CREDIT to the member's permanent origin_business_id.
 * When those are the same business (member rescans the shop that
 * originally recruited them), both simply fire to that one shop —
 * no separate "double" formula, they're independent awards that happen to
 * target the same business_id. See rescan_credit_events (one row per
 * award) rather than wallet_member_touchpoints itself, so a same-business
 * scan naturally produces two ledger rows without any special-casing here.
 */

import { supabaseAdmin } from '@/lib/supabase-admin'

const RESCAN_CREDIT = 1
const ORIGIN_RESCAN_CREDIT = 1

// Anti-farming guard: bounds how many rescan-credit AWARDS (ledger rows in
// rescan_credit_events, regardless of role) a single business can earn per
// UTC day. Same pattern as DAILY_SIGNUP_BONUS_CAP
// (src/app/api/wallet/membership/create/route.ts) but its own constant —
// this is a different credit-earning event with its own tuning. A
// same-business rescan checks (and can consume) this cap independently for
// each of its two awards, so it's possible one fires and the other is
// capped if the business was already at the boundary.
const DAILY_RESCAN_CREDIT_CAP_PER_BUSINESS = 20

// Anti-farming guard: a scan of the same (member, business) pair within the
// last 24h logs a touchpoint (as always — this is the raw scan-event log)
// but doesn't earn credit again. Doesn't stop a handful of real accomplices
// scanning once/day each staying under the cap — accepted residual risk,
// same tradeoff already made for the signup bonus.
const COOLDOWN_HOURS = 24

interface RescanTouchpointInput {
  memberId: string
  originBusinessId: string | null
  scannedBusinessId: string
  ip: string | null
}

/**
 * Call this on every scan by an EXISTING member (the returning-member path
 * in src/app/api/wallet/membership/create/route.ts) — logs the touchpoint
 * unconditionally, then awards rescan credit unless the (member, scanned
 * business) pair was already touched within the cooldown window. Never
 * throws for a credit-award failure — a rescan is best-effort income for
 * the shop, not something that should block the customer's own save/reuse
 * flow (same philosophy as the signup bonus and ad-credit transfer).
 */
export async function recordRescanTouchpoint({
  memberId,
  originBusinessId,
  scannedBusinessId,
  ip,
}: RescanTouchpointInput): Promise<void> {
  const cooldownSince = new Date(Date.now() - COOLDOWN_HOURS * 60 * 60 * 1000).toISOString()

  // Checked BEFORE inserting this scan's own touchpoint row, or it would
  // always find itself.
  const { count: recentTouchCount, error: cooldownErr } = await supabaseAdmin
    .from('wallet_member_touchpoints')
    .select('id', { count: 'exact', head: true })
    .eq('member_id', memberId)
    .eq('business_id', scannedBusinessId)
    .gte('scanned_at', cooldownSince)

  if (cooldownErr) {
    console.error('rescan cooldown check failed — logging touchpoint without credit', { memberId, scannedBusinessId, cooldownErr })
  }
  const withinCooldown = !cooldownErr && (recentTouchCount ?? 0) > 0

  const { data: touchpoint, error: insertErr } = await supabaseAdmin
    .from('wallet_member_touchpoints')
    .insert({ member_id: memberId, business_id: scannedBusinessId, scan_ip: ip })
    .select('id')
    .single()

  if (insertErr || !touchpoint) {
    console.error('touchpoint log failed — skipping rescan credit', { memberId, scannedBusinessId, insertErr })
    return
  }

  if (withinCooldown || cooldownErr) return // repeat scan within 24h, or couldn't verify — fail closed on the credit side

  await tryAwardRescanCredit({
    touchpointId: touchpoint.id,
    memberId,
    businessId: scannedBusinessId,
    role: 'scanned',
    amount: RESCAN_CREDIT,
  })

  // Fires independently of the block above — when originBusinessId ===
  // scannedBusinessId this just targets the same business a second time,
  // which is the intended "combined" behavior (two separate line items,
  // no special-case formula).
  if (originBusinessId) {
    await tryAwardRescanCredit({
      touchpointId: touchpoint.id,
      memberId,
      businessId: originBusinessId,
      role: 'origin',
      amount: ORIGIN_RESCAN_CREDIT,
    })
  }
}

async function tryAwardRescanCredit({
  touchpointId,
  memberId,
  businessId,
  role,
  amount,
}: {
  touchpointId: string
  memberId: string
  businessId: string
  role: 'scanned' | 'origin'
  amount: number
}): Promise<void> {
  const startOfTodayUtc = new Date()
  startOfTodayUtc.setUTCHours(0, 0, 0, 0)

  const { count: todaysAwardCount, error: capCheckErr } = await supabaseAdmin
    .from('rescan_credit_events')
    .select('id', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .gte('created_at', startOfTodayUtc.toISOString())

  if (capCheckErr) {
    console.error('rescan credit cap check failed — skipping award', { businessId, role, capCheckErr })
    return // fail closed, same as the signup bonus cap check
  }
  if ((todaysAwardCount ?? 0) >= DAILY_RESCAN_CREDIT_CAP_PER_BUSINESS) {
    console.log('rescan credit cap reached — skipping award', { businessId, role, todaysAwardCount })
    return
  }

  const { error: creditErr } = await supabaseAdmin.rpc('pay_rescan_credit', {
    p_business_id: businessId,
    p_amount: amount,
  })
  if (creditErr) {
    console.error('rescan credit payout failed', { businessId, role, creditErr })
    return
  }

  const { error: eventErr } = await supabaseAdmin
    .from('rescan_credit_events')
    .insert({ touchpoint_id: touchpointId, member_id: memberId, business_id: businessId, role, amount })
  if (eventErr) {
    // Credit already paid at this point — log loudly so the missing ledger
    // row (and therefore undercounted cap) gets reconciled/alerted on,
    // rather than silently losing the audit trail.
    console.error('rescan credit paid but event log failed — reconcile manually', { businessId, role, amount, eventErr })
  }
}
