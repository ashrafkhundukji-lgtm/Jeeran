import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import OwnerDashboardView from '@/components/OwnerDashboardView'
import { getBusinessPromotionLevel, getPromotionThresholds } from '@/lib/promotion'

export const dynamic = 'force-dynamic'

export default async function OwnerDashboardPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_id', user.id)
    .maybeSingle()
  if (businessError) throw new Error(businessError.message)
  if (!business) redirect('/dashboard/onboarding')
  if (business.is_frozen) redirect('/dashboard/frozen')

  // Metrics need to see scans_and_claims rows this business is either the
  // host OR the campaign creator of — RLS only allows the host owner to
  // read a row, so as the creator-only side we'd under-count. We've
  // already proven ownership of `business` above via the session client,
  // so it's safe to read the aggregate via the admin client here.
  const [{ data: metricsRows }, { data: campaigns }, promotionLevel, thresholds] = await Promise.all([
    supabaseAdmin.rpc('get_owner_metrics', { p_business_id: business.id }),
    supabase
      .from('campaigns')
      .select('*')
      .eq('creator_type', 'business')
      .eq('creator_id', business.id)
      .order('created_at', { ascending: false }),
    getBusinessPromotionLevel(business.id),
    getPromotionThresholds(),
  ])
  const metrics = metricsRows?.[0]
  const campaignIds = (campaigns ?? []).map((c) => c.id)

  // "This week vs last week" for the two headline numbers — same
  // definitions as get_owner_metrics (see 20261017d_owner_metrics_touchpoints.sql),
  // bucketed into the last 7 days vs the 7 before. Spend per offer comes
  // from the ad_credit_transfers ledger (20261017c), which only has rows
  // from the day it was introduced onward.
  const [{ data: weeklyRows, error: weeklyError }, { data: redemptionRows }, { data: transferRows }] = await Promise.all([
    supabaseAdmin.rpc('get_owner_weekly_metrics', { p_business_id: business.id }),
    campaignIds.length
      ? supabaseAdmin.from('redemptions').select('offer_id').eq('business_id', business.id).in('offer_id', campaignIds)
      : Promise.resolve({ data: [] as { offer_id: string }[] }),
    campaignIds.length
      ? supabaseAdmin.from('ad_credit_transfers').select('offer_id, amount').eq('from_business_id', business.id).in('offer_id', campaignIds)
      : Promise.resolve({ data: [] as { offer_id: string; amount: number }[] }),
  ])
  const weekly = weeklyError ? null : weeklyRows?.[0]

  // Per-campaign redemptions — the only per-campaign stat the data model
  // records (no per-campaign view/impression or spend log exists today).
  const redemptionsByCampaign: Record<string, number> = {}
  for (const r of redemptionRows ?? []) redemptionsByCampaign[r.offer_id] = (redemptionsByCampaign[r.offer_id] ?? 0) + 1
  const spentByCampaign: Record<string, number> = {}
  for (const t of transferRows ?? []) if (t.offer_id) spentByCampaign[t.offer_id] = (spentByCampaign[t.offer_id] ?? 0) + t.amount

  return (
    <OwnerDashboardView
      businessId={business.id}
      businessName={business.name}
      businessCategory={business.category}
      logoUrl={business.logo_url ?? null}
      coverUrl={business.cover_url ?? null}
      isSubscriptionActive={business.is_subscription_active}
      adCredits={metrics?.ad_credits ?? business.ad_credits}
      scansHosted={metrics?.scans_hosted ?? 0}
      customersAcquired={metrics?.customers_acquired ?? 0}
      scansWeek={weekly ? { thisWeek: Number(weekly.scans_this_week), lastWeek: Number(weekly.scans_last_week) } : null}
      acquiredWeek={weekly ? { thisWeek: Number(weekly.acquired_this_week), lastWeek: Number(weekly.acquired_last_week) } : null}
      campaigns={campaigns ?? []}
      redemptionsByCampaign={redemptionsByCampaign}
      spentByCampaign={spentByCampaign}
      promotionScore={promotionLevel.score}
      promotionLevel={promotionLevel.level}
      thresholds={thresholds}
      hasContactDetails={Boolean((business.phone || business.whatsapp) && business.latitude != null)}
      unseenMilestoneTier={business.unseen_milestone_tier}
      unseenMilestoneBonus={business.unseen_milestone_bonus}
    />
  )
}
