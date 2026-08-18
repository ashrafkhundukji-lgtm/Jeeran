import { supabaseAdmin } from './supabase-admin'

export interface LeaderboardEntry {
  businessId: string
  businessName: string
  newCustomers: number
}

interface LeaderboardRow {
  business_id: string
  business_name: string
  new_customers: number
}

export type LeaderboardPeriod = 'week' | 'month'

function sinceForPeriod(period: LeaderboardPeriod): Date {
  const since = new Date()
  since.setUTCDate(since.getUTCDate() - (period === 'week' ? 7 : 30))
  return since
}

// "Most active shops" — genuine new-customer acquisition only (first-time
// wallet_members rows attributed to that business), never rescans. Purely
// informational: see top_shops_by_new_customers()
// (supabase/migrations/20260818d_new_customer_leaderboard.sql) — this read
// has no bearing on any ranking function.
export async function getTopShopsByNewCustomers(period: LeaderboardPeriod, limit = 10): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabaseAdmin.rpc('top_shops_by_new_customers', {
    p_since: sinceForPeriod(period).toISOString(),
    p_limit: limit,
  })

  if (error) throw new Error(error.message)

  return ((data ?? []) as LeaderboardRow[]).map((r) => ({
    businessId: r.business_id,
    businessName: r.business_name,
    newCustomers: r.new_customers,
  }))
}
