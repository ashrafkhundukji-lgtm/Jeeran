import { NextRequest, NextResponse } from 'next/server'
import { refreshAllMembers } from '@/lib/wallet/geo-notify'

// Periodic safety-net sweep for the membership pass (src/lib/wallet/geo-notify.ts).
// Event-driven pushes (campaign activate/deactivate) cover the common case
// promptly; this catches everything that has no explicit trigger — offers
// whose end_date lapses, businesses whose subscription/trial expires, credits
// running out, etc. — by recomputing every member's nearby offers from
// scratch on a schedule. refreshMember() only PATCHes members whose offer
// set actually changed, so a no-op sweep is cheap.
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

  return NextResponse.json({ ok: true, sweptAt: new Date().toISOString() })
}
