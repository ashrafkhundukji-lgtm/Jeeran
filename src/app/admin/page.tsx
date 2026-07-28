import { getAdminOverview } from '@/lib/admin'
import SiteLogo from '@/components/SiteLogo'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const { shops, totals } = await getAdminOverview()

  return (
    <main className="max-w-6xl mx-auto px-4 py-10 w-full">
      <div className="mb-8">
        <SiteLogo className="h-14 mb-4" />
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

      <div className="overflow-x-auto border border-neutral-200 rounded-xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-400">
              <th className="px-4 py-3 font-medium">Shop</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Owner</th>
              <th className="px-4 py-3 font-medium">Location</th>
              <th className="px-4 py-3 font-medium">Credits</th>
              <th className="px-4 py-3 font-medium">Subscription</th>
              <th className="px-4 py-3 font-medium">Active Campaign</th>
              <th className="px-4 py-3 font-medium">Scans Hosted</th>
              <th className="px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {shops.map((shop) => (
              <tr key={shop.id} className="border-b border-neutral-100 last:border-0 align-top">
                <td className="px-4 py-3 font-medium text-neutral-900">
                  {shop.name}
                  <div className="text-xs text-neutral-400 font-normal">{shop.id}</div>
                </td>
                <td className="px-4 py-3 text-neutral-600">{shop.category}</td>
                <td className="px-4 py-3 text-neutral-600">{shop.ownerEmail ?? '—'}</td>
                <td className="px-4 py-3 text-neutral-600">
                  {shop.latitude != null && shop.longitude != null ? (
                    <a
                      href={`https://www.google.com/maps?q=${shop.latitude},${shop.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      {shop.latitude.toFixed(4)}, {shop.longitude.toFixed(4)}
                    </a>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-4 py-3 text-neutral-600">{shop.adCredits}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      shop.isSubscriptionActive
                        ? 'inline-block rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium px-2 py-0.5'
                        : 'inline-block rounded-full bg-red-50 text-red-700 text-xs font-medium px-2 py-0.5'
                    }
                  >
                    {shop.isSubscriptionActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  {shop.activeCampaign ? (
                    <>
                      {shop.activeCampaign.title}
                      <div className="text-xs text-neutral-400">{shop.activeCampaign.bidPerView} credits/view</div>
                    </>
                  ) : (
                    <span className="text-neutral-400">None</span>
                  )}
                </td>
                <td className="px-4 py-3 text-neutral-600">{shop.scansHosted}</td>
                <td className="px-4 py-3 text-neutral-500 whitespace-nowrap">
                  {new Date(shop.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {shops.length === 0 && <p className="text-sm text-neutral-400 mt-6">No shops yet.</p>}
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
