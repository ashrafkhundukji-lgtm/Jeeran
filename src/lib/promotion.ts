import { supabaseAdmin } from './supabase-admin'

export type PromotionLevel = 'bronze' | 'silver' | 'gold' | 'platinum'

export interface BusinessPromotionLevel {
  score: number
  level: PromotionLevel
}

// Mirrors promotion_level_for_score() in
// supabase/migrations/20260728_promotion_levels.sql — keep thresholds in
// sync. Used where fetching per-business via the RPC would mean N+1 calls
// (e.g. the admin shops table, which already has redemption counts in bulk).
export function levelForScore(score: number): PromotionLevel {
  if (score >= 50) return 'platinum'
  if (score >= 20) return 'gold'
  if (score >= 5) return 'silver'
  return 'bronze'
}

export async function getBusinessPromotionLevel(businessId: string): Promise<BusinessPromotionLevel> {
  const { data, error } = await supabaseAdmin
    .rpc('get_business_promotion_level', { p_business_id: businessId })
    .single()

  if (error) throw new Error(error.message)
  return data as BusinessPromotionLevel
}

export interface RankedBusiness {
  businessId: string
  businessName: string
  category: string
  score: number
  level: PromotionLevel
}

interface BrowseRow {
  business_id: string
  business_name: string
  category: string
  score: number
  level: PromotionLevel
}

export async function browseBusinessesByCategory(category: string, limit = 50): Promise<RankedBusiness[]> {
  const { data, error } = await supabaseAdmin.rpc('browse_businesses_by_category', {
    p_category: category,
    p_limit: limit,
  })

  if (error) throw new Error(error.message)

  return ((data ?? []) as BrowseRow[]).map((r) => ({
    businessId: r.business_id,
    businessName: r.business_name,
    category: r.category,
    score: r.score,
    level: r.level,
  }))
}
