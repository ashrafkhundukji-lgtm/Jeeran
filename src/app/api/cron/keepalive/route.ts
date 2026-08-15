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

  return NextResponse.json({ ok: true, pingedAt: new Date().toISOString() })
}
