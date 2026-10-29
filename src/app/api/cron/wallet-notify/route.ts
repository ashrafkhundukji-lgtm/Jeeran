import { NextRequest, NextResponse, after } from 'next/server'
import { sendWindowNotifications } from '@/lib/wallet/geo-notify'

// Lock-screen ping send window (src/lib/wallet/geo-notify.ts
// sendWindowNotifications; spec: docs/design/wallet-notification-headlines-spec.md).
// Called twice a day — 12:30 and 19:30 Riyadh — by Supabase pg_cron
// (net.http_get with `Authorization: Bearer $CRON_SECRET`), not by Vercel
// Cron: Hobby only allows once-a-day Vercel cron jobs. The schedule lives in
// pg_cron; see the spec for the SQL.
//
// pg_net doesn't need the result, so a real run answers 202 at once and
// does the work in after(). `?dryRun=1` runs synchronously and returns the
// summary instead: same picks, but nothing claimed, sent or written.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const provided = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!cronSecret || provided !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (req.nextUrl.searchParams.get('dryRun') === '1') {
    return NextResponse.json(await sendWindowNotifications({ dryRun: true }))
  }

  const startedAt = new Date().toISOString()
  after(async () => {
    try {
      const summary = await sendWindowNotifications()
      console.log('wallet-notify window done', { startedAt, ...summary, byShop: summary.byShop.length })
    } catch (err) {
      console.error('wallet-notify window failed', { startedAt, err })
    }
  })
  return NextResponse.json({ accepted: true, startedAt }, { status: 202 })
}
