import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedBusinessId } from '@/lib/business-auth'
import { getTopShopsByNewCustomers, type LeaderboardPeriod } from '@/lib/leaderboard'

export const dynamic = 'force-dynamic'

// Gated to any signed-in shop owner (not scoped to their own business —
// this is a platform-wide, purely informational leaderboard every owner
// sees the same version of).
export async function GET(req: NextRequest) {
  const businessId = await getAuthenticatedBusinessId()
  if (!businessId) {
    return NextResponse.json({ error: 'not authenticated as a business' }, { status: 401 })
  }

  const periodParam = req.nextUrl.searchParams.get('period')
  const period: LeaderboardPeriod = periodParam === 'month' ? 'month' : 'week'

  const entries = await getTopShopsByNewCustomers(period)
  return NextResponse.json({ period, entries })
}
