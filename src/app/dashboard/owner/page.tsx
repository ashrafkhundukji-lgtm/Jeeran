import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import OwnerDashboardView from '@/components/OwnerDashboardView'
import { getBusinessPromotionLevel } from '@/lib/promotion'

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
  const [{ data: metricsRows }, { data: campaigns }, promotionLevel] = await Promise.all([
    supabaseAdmin.rpc('get_owner_metrics', { p_business_id: business.id }),
    supabase
      .from('campaigns')
      .select('*')
      .eq('creator_type', 'business')
      .eq('creator_id', business.id)
      .order('created_at', { ascending: false }),
    getBusinessPromotionLevel(business.id),
  ])
  const metrics = metricsRows?.[0]

  return (
    <OwnerDashboardView
      businessId={business.id}
      businessName={business.name}
      businessCategory={business.category}
      isSubscriptionActive={business.is_subscription_active}
      adCredits={metrics?.ad_credits ?? business.ad_credits}
      scansHosted={metrics?.scans_hosted ?? 0}
      customersAcquired={metrics?.customers_acquired ?? 0}
      campaigns={campaigns ?? []}
      promotionScore={promotionLevel.score}
      promotionLevel={promotionLevel.level}
      unseenMilestoneTier={business.unseen_milestone_tier}
      unseenMilestoneBonus={business.unseen_milestone_bonus}
    />
  )
}
