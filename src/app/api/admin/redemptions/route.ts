/**
 * Admin dashboard — platform-wide "how many customers has Jeeran actually
 * brought into shops" numbers, plus a leaderboard of which shops are
 * benefiting most.
 *
 * Admins only (ADMIN_EMAILS, src/lib/adminAuth.ts): 401 not signed in,
 * 403 signed in but not an admin.
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdminApi } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const admin = await requireAdminApi()
  if (!admin.ok) return admin.response

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

