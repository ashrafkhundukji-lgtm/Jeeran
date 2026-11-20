import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Pings Supabase daily so the free-tier project doesn't auto-pause from
// inactivity (Supabase pauses free projects after ~1 week with no API
// activity). Triggered by Vercel Cron — see vercel.json. Vercel Cron sends a
// GET request and automatically attaches `Authorization: Bearer $CRON_SECRET`
// when that env var is set, so no extra scheduler config is needed.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const provided = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!cronSecret || provided !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Any authenticated API call keeps the project active — listing a single
  // user is cheap and doesn't depend on app schema staying stable.
  const { error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Retention for rate_limit_hits (hashed IP / device keys): nothing is
  // needed past the longest window (24 h); keep 2 days at most.
  const { error: pruneErr, count: pruned } = await supabaseAdmin
    .from('rate_limit_hits')
    .delete({ count: 'exact' })
    .lt('hit_at', new Date(Date.now() - 2 * 86_400_000).toISOString())
  if (pruneErr) console.error('cron/keepalive: rate_limit_hits prune failed', pruneErr.message)

  return NextResponse.json({ ok: true, pingedAt: new Date().toISOString(), rateLimitRowsPruned: pruned ?? 0 })
}
