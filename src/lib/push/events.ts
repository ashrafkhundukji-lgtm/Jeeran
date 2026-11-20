import { after } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import type { OfferStatusReason } from '@/lib/i18n/ownerPush'
import { sendOwnerPush } from './send'

// The five owner notification events. Each hook is called from the code
// path where the event happens and schedules its work with after(), so the
// response is sent first and nothing here can fail or delay it. Inside,
// every step is best-effort and logged.

function background(label: string, work: () => Promise<unknown>) {
  after(() =>
    work().catch((err) => {
      console.error(`owner push: ${label} failed`, err)
    }),
  )
}

// 1 + 2: a customer redeemed `offerTitle` at the redeeming shop. If the
// customer was recruited by another shop, that shop earned the credits.
export function onRedemption(args: {
  redeemingBusinessId: string
  memberId: string
  offerTitle: string
  creditsTransferred: number
}) {
  background('redemption', async () => {
    const credits = Math.max(0, args.creditsTransferred)
    const tasks: Promise<unknown>[] = [
      sendOwnerPush(args.redeemingBusinessId, { type: 'redeemed', offerTitle: args.offerTitle, creditsSpent: credits }, 'redeemed'),
      // Credits just went down: the offer may have stopped showing.
      checkOfferStatus(args.redeemingBusinessId),
    ]
    if (credits > 0) {
      tasks.push(
        (async () => {
          const [{ data: member }, { data: shop }] = await Promise.all([
            supabaseAdmin.from('wallet_members').select('origin_business_id').eq('id', args.memberId).maybeSingle(),
            supabaseAdmin.from('businesses').select('name').eq('id', args.redeemingBusinessId).maybeSingle(),
          ])
          const origin = member?.origin_business_id as string | null | undefined
          if (!origin || origin === args.redeemingBusinessId) return
          await sendOwnerPush(origin, { type: 'earned', shopName: shop?.name ?? '', creditsEarned: credits }, 'earned')
        })(),
      )
    }
    await Promise.all(tasks)
  })
}

// 3: a new customer joined through this shop's QR stand. Collapsed: the
// throttle allows one "signups" push per hour per shop, and that push
// counts every customer who joined since the previous one. Joins that land
// inside the hour are picked up by the next join after it, or by the daily
// sweep (sweepSignupSummaries) if no further join comes.
export function onCustomerJoined(businessId: string) {
  background('signup', () => sendSignupSummary(businessId))
}

async function countJoinsSince(businessId: string, since: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from('wallet_members')
    .select('id', { count: 'exact', head: true })
    .eq('origin_business_id', businessId)
    .gt('created_at', since)
  if (error) throw error
  return count ?? 0
}

async function sendSignupSummary(businessId: string) {
  return sendOwnerPush(
    businessId,
    async (previousSentAt) => {
      // First ever summary: count the last hour.
      const since = previousSentAt ?? new Date(Date.now() - 3600_000).toISOString()
      const n = await countJoinsSince(businessId, since)
      return n > 0 ? { type: 'signups', count: n } : null
    },
    'signups',
  )
}

// 4: re-check whether the shop's offer is showing (THE shared eligibility
// rule, via record_owner_offer_state()). Pushes only on the call that sees
// the change into "not showing".
export async function checkOfferStatus(businessId: string) {
  const { data, error } = await supabaseAdmin
    .rpc('record_owner_offer_state', { p_business_id: businessId })
    .maybeSingle<{ changed: boolean; eligible: boolean; reason: OfferStatusReason | null; offer_id: string | null }>()
  if (error) {
    console.error('owner push: record_owner_offer_state failed', { businessId, error })
    return
  }
  if (!data?.changed || data.eligible) return
  await sendOwnerPush(businessId, { type: 'offer_status', reason: data.reason ?? 'unknown', offerId: data.offer_id }, 'offer_status')
}

export function onOfferMaybeChanged(businessId: string) {
  background('offer status', () => checkOfferStatus(businessId))
}

// 5: trial ending soon (from the daily trials cron, alongside the email).
// The 30-day throttle makes it once per trial even if the email is retried.
export function onTrialEnding(businessId: string, trialEndsAt: string) {
  background('trial warning', () => sendOwnerPush(businessId, { type: 'trial', trialEndsAt }, 'trial'))
}

// Daily sweeps (trials cron): offers that stopped showing because of time
// (end date passed, trial grace over), and signup summaries still pending.
export function scheduleDailySweeps() {
  background('daily sweeps', async () => {
    const { data: ids, error } = await supabaseAdmin.rpc('owner_offer_state_sweep_ids')
    if (error) throw error
    for (const row of (ids ?? []) as { business_id: string }[]) {
      await checkOfferStatus(row.business_id)
    }

    // Pending signup summaries: only shops that have a device registered.
    const { data: subs, error: subsErr } = await supabaseAdmin
      .from('owner_push_subscriptions')
      .select('business_id')
      .eq('enabled', true)
    if (subsErr) throw subsErr
    for (const businessId of new Set((subs ?? []).map((s) => s.business_id as string))) {
      const { data: last } = await supabaseAdmin
        .from('owner_push_log')
        .select('sent_at')
        .eq('business_id', businessId)
        .eq('type', 'signups')
        .order('sent_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      // Never-notified shops are covered by the next join; only flush joins
      // that arrived after a summary was already sent.
      if (!last) continue
      if ((await countJoinsSince(businessId, last.sent_at)) > 0) await sendSignupSummary(businessId)
    }
  })
}
