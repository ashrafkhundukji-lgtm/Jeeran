import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import OwnerDashboardView from '@/components/OwnerDashboardView'
import { getBusinessPromotionLevel, getPromotionThresholds } from '@/lib/promotion'

export const dynamic = 'force-dynamic'

const DAY_MS = 86_400_000

// Last 7 days vs the 7 before, as ISO bounds. Kept outside the component
// (request-time clock read, not render state).
function weekBounds() {
  const now = Date.now()
  return { weekAgo: new Date(now - 7 * DAY_MS).toISOString(), twoWeeksAgo: new Date(now - 14 * DAY_MS).toISOString() }
}

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
  // definitions as get_owner_metrics (hosted = scans_and_claims rows hosted
  // here; acquired = redeemed claims on this shop's campaigns), just
  // bucketed by time: the last 7 days vs the 7 before. Read-only counts.
  const { weekAgo, twoWeeksAgo } = weekBounds()
  const hosted = (from: string, to?: string) => {
    let q = supabaseAdmin
      .from('scans_and_claims')
      .select('id', { count: 'exact', head: true })
      .eq('host_business_id', business.id)
      .gte('created_at', from)
    if (to) q = q.lt('created_at', to)
    return q
  }
  const acquired = (from: string, to?: string) => {
    if (!campaignIds.length) return Promise.resolve({ count: 0, error: null })
    let q = supabaseAdmin
      .from('scans_and_claims')
      .select('id', { count: 'exact', head: true })
      .in('campaign_id', campaignIds)
      .eq('is_redeemed', true)
      .gte('redeemed_at', from)
    if (to) q = q.lt('redeemed_at', to)
    return q
  }

  const [hostedNow, hostedPrev, acquiredNow, acquiredPrev, { data: redemptionRows }] = await Promise.all([
    hosted(weekAgo),
    hosted(twoWeeksAgo, weekAgo),
    acquired(weekAgo),
    acquired(twoWeeksAgo, weekAgo),
    campaignIds.length
      ? supabaseAdmin.from('redemptions').select('offer_id').eq('business_id', business.id).in('offer_id', campaignIds)
      : Promise.resolve({ data: [] as { offer_id: string }[] }),
  ])
  const week = (a: { count: number | null; error: unknown }, b: { count: number | null; error: unknown }) =>
    a.error || b.error || a.count == null || b.count == null ? null : { thisWeek: a.count, lastWeek: b.count }

  // Per-campaign redemptions — the only per-campaign stat the data model
  // records (no per-campaign view/impression or spend log exists today).
  const redemptionsByCampaign: Record<string, number> = {}
  for (const r of redemptionRows ?? []) redemptionsByCampaign[r.offer_id] = (redemptionsByCampaign[r.offer_id] ?? 0) + 1

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
      scansWeek={week(hostedNow, hostedPrev)}
      acquiredWeek={week(acquiredNow, acquiredPrev)}
      campaigns={campaigns ?? []}
      redemptionsByCampaign={redemptionsByCampaign}
      promotionScore={promotionLevel.score}
      promotionLevel={promotionLevel.level}
      thresholds={thresholds}
      hasContactDetails={Boolean((business.phone || business.whatsapp) && business.latitude != null)}
      unseenMilestoneTier={business.unseen_milestone_tier}
      unseenMilestoneBonus={business.unseen_milestone_bonus}
    />
  )
}
