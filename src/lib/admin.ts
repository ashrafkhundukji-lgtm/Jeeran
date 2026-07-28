import { supabaseAdmin } from './supabase-admin'
import { levelForScore, type PromotionLevel } from './promotion'

export type BillingStatus = 'paid' | 'trial' | 'lapsed'

export interface AdminShopRow {
  id: string
  name: string
  category: string
  ownerEmail: string | null
  latitude: number | null
  longitude: number | null
  adCredits: number
  isSubscriptionActive: boolean
  billingStatus: BillingStatus
  trialEndsAt: string | null
  isFrozen: boolean
  frozenReason: string | null
  activeCampaign: { title: string; bidPerView: number } | null
  scansHosted: number
  promotionScore: number
  promotionLevel: PromotionLevel
  createdAt: string
}

export interface AdminOverview {
  shops: AdminShopRow[]
  totals: {
    shopCount: number
    activeSubscriptionCount: number
    activeCampaignCount: number
    totalAdCredits: number
    totalScans: number
  }
}

function billingStatusFor(b: {
  is_subscription_active: boolean
  stripe_subscription_id: string | null
}): BillingStatus {
  if (!b.is_subscription_active) return 'lapsed'
  return b.stripe_subscription_id ? 'paid' : 'trial'
}

// Service-role reads across every shop for the operator overview — there's
// no per-owner RLS scoping here on purpose, this is an internal admin view.
export async function getAdminOverview(): Promise<AdminOverview> {
  const [
    { data: businesses, error: bizError },
    { data: campaigns, error: campError },
    { data: scans, error: scanError },
    { data: redemptions, error: redemptionError },
  ] = await Promise.all([
    supabaseAdmin
      .from('businesses')
      .select(
        'id, name, category, owner_id, latitude, longitude, ad_credits, is_subscription_active, stripe_subscription_id, trial_ends_at, is_frozen, frozen_reason, created_at',
      )
      .order('created_at', { ascending: true }),
    supabaseAdmin
      .from('campaigns')
      .select('creator_id, title, bid_per_view')
      .eq('creator_type', 'business')
      .eq('is_active', true),
    supabaseAdmin.from('scans_and_claims').select('host_business_id'),
    supabaseAdmin.from('redemptions').select('business_id'),
  ])

  if (bizError) throw new Error(bizError.message)
  if (campError) throw new Error(campError.message)
  if (scanError) throw new Error(scanError.message)
  if (redemptionError) throw new Error(redemptionError.message)

  const ownerIds = Array.from(new Set((businesses ?? []).map((b) => b.owner_id)))
  const emailByOwnerId = new Map<string, string>()
  await Promise.all(
    ownerIds.map(async (id) => {
      const { data } = await supabaseAdmin.auth.admin.getUserById(id)
      if (data.user?.email) emailByOwnerId.set(id, data.user.email)
    }),
  )

  const activeCampaignByBusinessId = new Map<string, { title: string; bidPerView: number }>()
  for (const c of campaigns ?? []) {
    activeCampaignByBusinessId.set(c.creator_id, { title: c.title, bidPerView: c.bid_per_view })
  }

  const scansHostedByBusinessId = new Map<string, number>()
  for (const s of scans ?? []) {
    scansHostedByBusinessId.set(s.host_business_id, (scansHostedByBusinessId.get(s.host_business_id) ?? 0) + 1)
  }

  const promotionScoreByBusinessId = new Map<string, number>()
  for (const r of redemptions ?? []) {
    promotionScoreByBusinessId.set(r.business_id, (promotionScoreByBusinessId.get(r.business_id) ?? 0) + 1)
  }

  const shops: AdminShopRow[] = (businesses ?? []).map((b) => {
    const promotionScore = promotionScoreByBusinessId.get(b.id) ?? 0
    return {
      id: b.id,
      name: b.name,
      category: b.category,
      ownerEmail: emailByOwnerId.get(b.owner_id) ?? null,
      latitude: b.latitude,
      longitude: b.longitude,
      adCredits: b.ad_credits,
      isSubscriptionActive: b.is_subscription_active,
      billingStatus: billingStatusFor(b),
      trialEndsAt: b.trial_ends_at,
      isFrozen: b.is_frozen,
      frozenReason: b.frozen_reason,
      activeCampaign: activeCampaignByBusinessId.get(b.id) ?? null,
      scansHosted: scansHostedByBusinessId.get(b.id) ?? 0,
      promotionScore,
      promotionLevel: levelForScore(promotionScore),
      createdAt: b.created_at,
    }
  })

  return {
    shops,
    totals: {
      shopCount: shops.length,
      activeSubscriptionCount: shops.filter((s) => s.isSubscriptionActive).length,
      activeCampaignCount: shops.filter((s) => s.activeCampaign).length,
      totalAdCredits: shops.reduce((sum, s) => sum + s.adCredits, 0),
      totalScans: shops.reduce((sum, s) => sum + s.scansHosted, 0),
    },
  }
}
