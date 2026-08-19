import { NextRequest, NextResponse } from 'next/server'
import { refreshAllMembers, sendDailyNotificationBatch } from '@/lib/wallet/geo-notify'

// Periodic safety-net sweep for the membership pass (src/lib/wallet/geo-notify.ts).
// Event-driven pushes (campaign activate/deactivate) cover the common case
// promptly; this catches everything that has no explicit trigger — offers
// whose end_date lapses, businesses whose subscription/trial expires, credits
// running out, etc. — by recomputing every member's nearby offers from
// scratch on a schedule. refreshMember() only PATCHes members whose offer
// set actually changed, so a no-op sweep is cheap.
//
// Also the once-daily home for the batched lock-screen notification job
// (sendDailyNotificationBatch) — deliberately reusing this cron's existing
// daily schedule rather than registering a second Vercel Cron job for it
// (Hobby plan caps cron jobs; "once a day, same fixed time" is exactly what
// the notification batch wants anyway). Runs after the card-refresh sweep so
// the batch's own nearby_active_offers() recompute (it does its own,
// independent of this sweep's) reflects whatever just got synced. See
// supabase/migrations/20260820_notification_batching.sql for the full
// card-vs-notification split rationale.
//
// Same pattern as src/app/api/cron/keepalive/route.ts (the cron route that's
// actually wired up): GET handler + `Authorization: Bearer $CRON_SECRET`,
// which is what Vercel Cron sends automatically once CRON_SECRET is set — see
// vercel.json. Deliberately NOT following src/app/api/cron/trials/route.ts's
// POST-handler shape; that route isn't registered in vercel.json and
// wouldn't receive Vercel Cron's GET pings if it were.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const provided = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!cronSecret || provided !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await refreshAllMembers()
  await sendDailyNotificationBatch()

  return NextResponse.json({ ok: true, sweptAt: new Date().toISOString() })
}
