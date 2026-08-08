import { getAdminOverview } from '@/lib/admin'
import AdminShopsList from '@/components/AdminShopsList'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const { shops, totals } = await getAdminOverview()

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-10">
        <StatTile label="Shops" value={totals.shopCount} />
        <StatTile label="Active Subscriptions" value={totals.activeSubscriptionCount} />
        <StatTile label="Active Campaigns" value={totals.activeCampaignCount} />
        <StatTile label="Ad Credits" value={totals.totalAdCredits} />
        <StatTile label="Scans Hosted" value={totals.totalScans} />
      </div>

      <AdminShopsList shops={shops} />
    </>
  )
}

function StatTile({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border border-neutral-200 rounded-xl p-4 text-center">
      <div className="font-[family-name:var(--font-archivo)] text-2xl font-bold">{value}</div>
      <div className="text-xs text-[#5a5a5a] mt-1">{label}</div>
    </div>
  )
}
