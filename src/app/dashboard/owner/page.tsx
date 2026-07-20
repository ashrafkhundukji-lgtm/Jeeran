import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import CampaignManager from '@/components/CampaignManager'
import SignOutButton from '@/components/SignOutButton'
import SubscriptionBanner from '@/components/SubscriptionBanner'

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

  // Metrics need to see scans_and_claims rows this business is either the
  // host OR the campaign creator of — RLS only allows the host owner to
  // read a row, so as the creator-only side we'd under-count. We've
  // already proven ownership of `business` above via the session client,
  // so it's safe to read the aggregate via the admin client here.
  const [{ data: metricsRows }, { data: campaigns }] = await Promise.all([
    supabaseAdmin.rpc('get_owner_metrics', { p_business_id: business.id }),
    supabase
      .from('campaigns')
      .select('*')
      .eq('creator_type', 'business')
      .eq('creator_id', business.id)
      .order('created_at', { ascending: false }),
  ])
  const metrics = metricsRows?.[0]

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">{business.name}</h1>
          <p className="text-sm text-neutral-500">{business.category}</p>
        </div>
        <div className="flex items-center gap-4">
          <a href="/dashboard/billing" className="text-sm text-neutral-500 underline">
            Billing
          </a>
          <SignOutButton />
        </div>
      </div>

      <SubscriptionBanner
        isSubscriptionActive={business.is_subscription_active}
        adCredits={metrics?.ad_credits ?? business.ad_credits}
      />

      <div className="grid grid-cols-3 gap-3 mb-10">
        <MetricTile label="رصيد النقاط الحالي" value={metrics?.ad_credits ?? business.ad_credits} />
        <MetricTile label="Scans Hosted" value={metrics?.scans_hosted ?? 0} />
        <MetricTile label="Customers Acquired" value={metrics?.customers_acquired ?? 0} />
      </div>

      <CampaignManager initialCampaigns={campaigns ?? []} />

      <section className="mt-10">
        <h2 className="text-lg font-semibold mb-3">Your QR Stand</h2>
        <div className="border border-neutral-200 rounded-xl p-4 flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/qr/${business.id}`} alt="QR code" className="w-32 h-32" />
          <div>
            <p className="text-sm text-neutral-600 mb-3">
              Print this and slip it into your acrylic stand.
            </p>
            <a
              href={`/api/qr/${business.id}/pdf`}
              className="inline-block bg-black text-white text-sm font-medium rounded-lg px-4 py-2"
            >
              Download Print-Ready PDF
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}

function MetricTile({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border border-neutral-200 rounded-xl p-4 text-center">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs text-neutral-500 mt-1">{label}</div>
    </div>
  )
}
