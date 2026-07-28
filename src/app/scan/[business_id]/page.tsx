import { notFound } from 'next/navigation'
import { getHostBusiness, getTopAdsForBusiness } from '@/lib/matchmaking'
import SaveToWalletButton from '@/components/SaveToWalletButton'
import AddToWalletMembershipButton from '@/components/AddToWalletMembershipButton'
import SiteLogo from '@/components/SiteLogo'

export const dynamic = 'force-dynamic'

export default async function ScanPage({
  params,
}: {
  params: Promise<{ business_id: string }>
}) {
  const { business_id } = await params
  const host = await getHostBusiness(business_id)
  if (!host) notFound()

  const ads = await getTopAdsForBusiness(host.id, 3)

  return (
    <main className="min-h-full flex flex-col bg-neutral-50 px-4 py-8">
      <div className="max-w-sm mx-auto w-full">
        <div className="flex justify-center mb-6">
          <SiteLogo className="h-14" />
        </div>

        <div className="text-center mb-6">
          <p className="text-xs uppercase tracking-wide text-neutral-400 mb-1">
            You&apos;re at
          </p>
          <h1 className="text-xl font-semibold text-neutral-900">{host.name}</h1>
        </div>

        <AddToWalletMembershipButton businessId={host.id} />

        {ads.length === 0 ? (
          <p className="text-sm text-neutral-500 text-center py-12">
            No offers nearby right now — check back later.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {ads.map((ad) => (
              <div
                key={ad.campaignId}
                className="rounded-xl bg-white border border-neutral-200 p-4 shadow-sm"
              >
                {ad.creatorName && (
                  <p className="text-xs text-neutral-400 mb-1">{ad.creatorName}</p>
                )}
                <h2 className="font-medium text-neutral-900 mb-1">{ad.title}</h2>
                {ad.description && (
                  <p className="text-sm text-neutral-500 mb-3">{ad.description}</p>
                )}
                <SaveToWalletButton campaignId={ad.campaignId} hostBusinessId={host.id} />
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
