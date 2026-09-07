import { supabaseAdmin } from './supabase-admin'

export type PromotionLevel = 'bronze' | 'silver' | 'gold' | 'platinum'

export interface BusinessPromotionLevel {
  score: number
  level: PromotionLevel
}

export interface PromotionThresholds {
  silverThreshold: number
  goldThreshold: number
  platinumThreshold: number
  bidTiebreakRange: number
  // One-time milestone bonus paid the moment a business first crosses into
  // each tier (Phase 4, item 9) — same table Phase 3 already made
  // admin-editable, reusing /api/admin/settings rather than a second
  // config surface. See check_and_award_milestone_bonus()
  // (20260818e_milestone_bonus.sql).
  silverMilestoneBonus: number
  goldMilestoneBonus: number
  platinumMilestoneBonus: number
}

interface PromotionSettingsRow {
  silver_threshold: number
  gold_threshold: number
  platinum_threshold: number
  bid_tiebreak_range: number
  silver_milestone_bonus: number
  gold_milestone_bonus: number
  platinum_milestone_bonus: number
}

// Single shared config source — read by promotion_level_for_score() in
// Postgres (get_business_promotion_level, browse_businesses_by_category,
// nearby_active_offers all call it, so they always agree on tier
// boundaries) and by this same table here for the one TS caller
// (levelForScore, used by admin.ts to avoid N+1 RPC calls across every
// shop). Admin-editable via /api/admin/settings.
export async function getPromotionThresholds(): Promise<PromotionThresholds> {
  const { data, error } = await supabaseAdmin.from('promotion_settings').select('*').single()
  if (error) throw new Error(error.message)
  const row = data as PromotionSettingsRow
  return {
    silverThreshold: row.silver_threshold,
    goldThreshold: row.gold_threshold,
    platinumThreshold: row.platinum_threshold,
    bidTiebreakRange: row.bid_tiebreak_range,
    silverMilestoneBonus: row.silver_milestone_bonus,
    goldMilestoneBonus: row.gold_milestone_bonus,
    platinumMilestoneBonus: row.platinum_milestone_bonus,
  }
}

export async function updatePromotionThresholds(thresholds: PromotionThresholds): Promise<void> {
  const { error } = await supabaseAdmin
    .from('promotion_settings')
    .update({
      silver_threshold: thresholds.silverThreshold,
      gold_threshold: thresholds.goldThreshold,
      platinum_threshold: thresholds.platinumThreshold,
      bid_tiebreak_range: thresholds.bidTiebreakRange,
      silver_milestone_bonus: thresholds.silverMilestoneBonus,
      gold_milestone_bonus: thresholds.goldMilestoneBonus,
      platinum_milestone_bonus: thresholds.platinumMilestoneBonus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', true)
  if (error) throw new Error(error.message)
}

// Mirrors promotion_level_for_score() in
// supabase/migrations/20260818c_promotion_tier_tiebreaker.sql — keep in
// sync. Takes thresholds explicitly (rather than hardcoding them, the
// pre-Phase-3 behavior) so callers pull the current admin-configured
// values via getPromotionThresholds() instead of drifting from the DB
// source of truth the moment an admin changes them.
export function levelForScore(score: number, thresholds: PromotionThresholds): PromotionLevel {
  if (score >= thresholds.platinumThreshold) return 'platinum'
  if (score >= thresholds.goldThreshold) return 'gold'
  if (score >= thresholds.silverThreshold) return 'silver'
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
  businessLat: number | null
  businessLng: number | null
  hasActiveOffer: boolean
  topOfferId: string | null
  topOfferTitle: string | null
}

interface BrowseRow {
  business_id: string
  business_name: string
  category: string
  score: number
  level: PromotionLevel
  business_lat: number | null
  business_lng: number | null
  has_active_offer: boolean
  top_offer_id: string | null
  top_offer_title: string | null
}

// One flat list across every category — replaces the old one-category-at-a-
// time browse_businesses_by_category, which powered a category-grid-then-
// drill-down flow with no search, no chips, and no sense of which shops
// actually had something live. /browse now filters this client-side with
// the same search+chip pattern NearbyShopsView (/wallet/shops) already
// established. See supabase/migrations/20260907_browse_all_businesses.sql.
export async function browseAllBusinesses(limit = 200): Promise<RankedBusiness[]> {
  const { data, error } = await supabaseAdmin.rpc('browse_all_businesses', { p_limit: limit })

  if (error) throw new Error(error.message)

  return ((data ?? []) as BrowseRow[]).map((r) => ({
    businessId: r.business_id,
    businessName: r.business_name,
    category: r.category,
    score: r.score,
    level: r.level,
    businessLat: r.business_lat,
    businessLng: r.business_lng,
    hasActiveOffer: r.has_active_offer,
    topOfferId: r.top_offer_id,
    topOfferTitle: r.top_offer_title,
  }))
}
