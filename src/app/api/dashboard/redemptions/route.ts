/**
 * Shop dashboard — "customers claimed your offers via Jeeran" numbers.
 * Scoped to the authenticated business only.
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthenticatedBusinessId } from '@/lib/business-auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const businessId = await getAuthenticatedBusinessId()
  if (!businessId) {
    return NextResponse.json({ error: 'not authenticated as a business' }, { status: 401 })
  }

  const [
    { data: summary, error: summaryErr },
    { data: series, error: seriesErr },
    { data: conversion, error: conversionErr },
  ] = await Promise.all([
    supabaseAdmin.rpc('business_redemption_summary', { p_business_id: businessId }).single(),
    supabaseAdmin.rpc('business_redemption_timeseries', { p_business_id: businessId, p_days: 30 }),
    supabaseAdmin.rpc('business_conversion_summary', { p_business_id: businessId }).single(),
  ])

  if (summaryErr) return NextResponse.json({ error: summaryErr.message }, { status: 500 })
  if (seriesErr) return NextResponse.json({ error: seriesErr.message }, { status: 500 })
  if (conversionErr) return NextResponse.json({ error: conversionErr.message }, { status: 500 })

  return NextResponse.json({ summary, series, conversion })
}
