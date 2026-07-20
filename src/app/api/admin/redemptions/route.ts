/**
 * Admin dashboard — platform-wide "how many customers has Jeeran actually
 * brought into shops" numbers, plus a leaderboard of which shops are
 * benefiting most.
 *
 * Auth is a deliberate stub: there is no admin authentication anywhere in
 * this app yet (src/app/admin/page.tsx is currently unauthenticated too —
 * see getAdminOverview() in src/lib/admin.ts). That's a real gap outside
 * this feature's scope, not something to paper over here with a throwaway
 * check. This route stays locked down (always 401) until real admin auth
 * exists.
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const isAdmin = await getIsAuthenticatedAdmin()
  if (!isAdmin) {
    return NextResponse.json({ error: 'not authenticated as admin' }, { status: 401 })
  }

  const [
    { data: summary, error: summaryErr },
    { data: topBusinesses, error: topErr },
    { data: conversion, error: conversionErr },
  ] = await Promise.all([
    supabaseAdmin.rpc('platform_redemption_summary').single(),
    supabaseAdmin.rpc('platform_top_businesses_by_redemptions', { p_limit: 10 }),
    supabaseAdmin.rpc('platform_conversion_summary').single(),
  ])

  if (summaryErr) return NextResponse.json({ error: summaryErr.message }, { status: 500 })
  if (topErr) return NextResponse.json({ error: topErr.message }, { status: 500 })
  if (conversionErr) return NextResponse.json({ error: conversionErr.message }, { status: 500 })

  return NextResponse.json({ summary, topBusinesses, conversion })
}

async function getIsAuthenticatedAdmin(): Promise<boolean> {
  // TODO: no admin auth mechanism exists in the app yet. Needs a real
  // decision (role column? allowlisted email? separate admin table?) before
  // this route — or src/app/admin/page.tsx itself — can be unlocked.
  return false
}
