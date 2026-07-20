import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendEmail, EmailNotConfiguredError } from '@/lib/email/mailer'

// Meant to be hit once a day by an external scheduler (Vercel Cron, GitHub
// Actions, etc.) with `Authorization: Bearer $CRON_SECRET`. Needs Node for
// nodemailer/SMTP — not edge-compatible.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const provided = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!cronSecret || provided !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: dueShops, error: dueError } = await supabaseAdmin.rpc('businesses_due_trial_warning')
  if (dueError) return NextResponse.json({ error: dueError.message }, { status: 500 })

  let warned = 0
  for (const shop of dueShops ?? []) {
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(shop.owner_id)
    const ownerEmail = userData.user?.email
    if (!ownerEmail) continue

    try {
      await sendEmail(
        ownerEmail,
        'Your Jeeran Network trial ends in a week',
        `<p>Hi,</p>` +
          `<p><strong>${shop.name}</strong>'s 3-month trial ends on ` +
          `${new Date(shop.trial_ends_at).toLocaleDateString()}. Subscribe now to keep your campaigns ` +
          `visible to nearby customers — otherwise your account goes inactive when the trial ends.</p>` +
          `<p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing">Manage billing</a></p>`,
      )
    } catch (err) {
      if (err instanceof EmailNotConfiguredError) {
        return NextResponse.json({ error: err.message }, { status: 501 })
      }
      console.error('cron/trials: failed to email business', shop.id, err)
      continue
    }

    const { error: markError } = await supabaseAdmin.rpc('mark_trial_warning_sent', { p_business_id: shop.id })
    if (markError) console.error('cron/trials: mark_trial_warning_sent error:', shop.id, markError.message)
    else warned++
  }

  const { data: expiredCount, error: expireError } = await supabaseAdmin.rpc('expire_lapsed_trials')
  if (expireError) return NextResponse.json({ error: expireError.message }, { status: 500 })

  return NextResponse.json({ warned, expired: expiredCount ?? 0 })
}
