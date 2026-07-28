import { getAdminOverview } from '@/lib/admin'
import SiteLogo from '@/components/SiteLogo'
import AdminShopsList from '@/components/AdminShopsList'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const { shops, totals } = await getAdminOverview()

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 w-full">
      <div className="mb-8">
        <SiteLogo className="h-20 mb-4" />
        <h1 className="text-xl font-semibold">Shops Admin</h1>
        <p className="text-sm text-neutral-500">
          Internal overview — no login required yet, do not expose this URL publicly.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-10">
        <StatTile label="Shops" value={totals.shopCount} />
        <StatTile label="Active Subscriptions" value={totals.activeSubscriptionCount} />
        <StatTile label="Active Campaigns" value={totals.activeCampaignCount} />
        <StatTile label="Ad Credits" value={totals.totalAdCredits} />
        <StatTile label="Scans Hosted" value={totals.totalScans} />
      </div>

      <AdminShopsList shops={shops} />
    </main>
  )
}

function StatTile({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border border-neutral-200 rounded-xl p-4 text-center">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs text-neutral-500 mt-1">{label}</div>
    </div>
  )
}
