import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendEmail, EmailNotConfiguredError } from '@/lib/email/mailer'

// Daily trial enforcement, fired by Vercel Cron (vercel.json). Same auth as
// the other cron routes: GET + `Authorization: Bearer $CRON_SECRET`, which
// Vercel Cron attaches automatically once CRON_SECRET is set. POST is kept
// as an alias for any manual caller of the old shape. Needs Node for
// nodemailer/SMTP — not edge-compatible.
//
// 1. Warning email, promotion_settings.trial_warning_days before
//    trial_ends_at, once per shop: claim_trial_warning() flips
//    trial_notified_at atomically BEFORE sending, so overlapping runs can't
//    both email; a failed send releases the claim for the next run.
// 2. expire_lapsed_trials(): is_subscription_active -> false once the trial
//    has ended. Customer exposure does NOT wait for this — it is computed
//    from the dates (shop_is_exposed() in
//    supabase/migrations/20261030_launch_integrity_eligibility.sql) and
//    runs on for subscription_grace_days after the trial ends.
//
// `?dryRun=1` lists who would be warned or deactivated and changes nothing.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface DueShop {
  id: string
  owner_id: string
  name: string
  trial_ends_at: string
}

const DAY_MS = 86_400_000

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const provided = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!cronSecret || provided !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const dryRun = req.nextUrl.searchParams.get('dryRun') === '1'

  const [{ data: dueShops, error: dueError }, { data: settings, error: settingsError }] = await Promise.all([
    supabaseAdmin.rpc('businesses_due_trial_warning'),
    supabaseAdmin.from('promotion_settings').select('subscription_grace_days').limit(1).maybeSingle(),
  ])
  if (dueError) return NextResponse.json({ error: dueError.message }, { status: 500 })
  if (settingsError) return NextResponse.json({ error: settingsError.message }, { status: 500 })
  const graceDays = settings?.subscription_grace_days ?? 7

  if (dryRun) {
    // Same condition expire_lapsed_trials() updates on.
    const { data: lapsed, error: lapsedError } = await supabaseAdmin
      .from('businesses')
      .select('id, name, trial_ends_at')
      .eq('is_subscription_active', true)
      .is('stripe_subscription_id', null)
      .lte('trial_ends_at', new Date().toISOString())
      .order('trial_ends_at')
    if (lapsedError) return NextResponse.json({ error: lapsedError.message }, { status: 500 })
    const withExposureEnd = (s: { trial_ends_at: string }) =>
      new Date(new Date(s.trial_ends_at).getTime() + graceDays * DAY_MS).toISOString()
    return NextResponse.json({
      dryRun: true,
      graceDays,
      wouldWarn: ((dueShops ?? []) as DueShop[]).map((s) => ({
        id: s.id,
        name: s.name,
        trialEndsAt: s.trial_ends_at,
        exposureEndsAt: withExposureEnd(s),
      })),
      wouldDeactivate: (lapsed ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        trialEndsAt: s.trial_ends_at,
        exposureEndsAt: withExposureEnd(s),
      })),
    })
  }

  let warned = 0
  for (const shop of (dueShops ?? []) as DueShop[]) {
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(shop.owner_id)
    const ownerEmail = userData.user?.email
    if (!ownerEmail) continue

    const { data: claimed, error: claimError } = await supabaseAdmin.rpc('claim_trial_warning', { p_business_id: shop.id })
    if (claimError) {
      console.error('cron/trials: claim_trial_warning error:', shop.id, claimError.message)
      continue
    }
    if (!claimed) continue // another run already sent it

    const trialEnd = new Date(shop.trial_ends_at)
    const exposureEnd = new Date(trialEnd.getTime() + graceDays * DAY_MS)
    try {
      await sendEmail(
        ownerEmail,
        'Your Jeeran Network trial is ending soon',
        `<p>Hi,</p>` +
          `<p><strong>${shop.name}</strong>'s free trial ends on ${trialEnd.toLocaleDateString('en-GB')}. ` +
          `Subscribe to keep your offers visible to nearby customers — without a subscription they stop ` +
          `being shown on ${exposureEnd.toLocaleDateString('en-GB')}.</p>` +
          `<p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing">Manage billing</a></p>`,
      )
    } catch (err) {
      const { error: releaseError } = await supabaseAdmin.rpc('release_trial_warning', { p_business_id: shop.id })
      if (releaseError) console.error('cron/trials: release_trial_warning error:', shop.id, releaseError.message)
      if (err instanceof EmailNotConfiguredError) {
        return NextResponse.json({ error: err.message }, { status: 501 })
      }
      console.error('cron/trials: failed to email business', shop.id, err)
      continue
    }
    warned++
  }

  const { data: expiredCount, error: expireError } = await supabaseAdmin.rpc('expire_lapsed_trials')
  if (expireError) return NextResponse.json({ error: expireError.message }, { status: 500 })

  return NextResponse.json({ warned, expired: expiredCount ?? 0 })
}

export const POST = GET
