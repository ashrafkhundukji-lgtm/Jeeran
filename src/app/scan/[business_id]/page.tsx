import { notFound } from 'next/navigation'
import { getHostBusiness, getTopAdsForBusiness } from '@/lib/matchmaking'
import AddToWalletMembershipButton from '@/components/AddToWalletMembershipButton'
import SiteLogo from '@/components/SiteLogo'

// Apple Wallet (SaveToWalletButton) is intentionally not rendered here — its
// add-confirmation signal isn't wired up yet (see the component's own
// comment), so it's not ready for the live scan page. Re-add the import and
// the <SaveToWalletButton /> render below once that's confirmed working.

export const dynamic = 'force-dynamic'

export default async function ScanPage({
  params,
}: {
  params: Promise<{ business_id: string }>
}) {
  const { business_id } = await params
  const host = await getHostBusiness(business_id)
  if (!host) notFound()

  if (host.isFrozen) {
    return (
      <main className="min-h-full flex flex-col items-center justify-center bg-[#FFF8EC] px-4 py-8 text-center">
        <div className="max-w-sm w-full">
          <div className="flex justify-center mb-6">
            <SiteLogo className="h-20" />
          </div>
          <p className="text-sm text-[#6B5A8C]">This shop is temporarily unavailable.</p>
        </div>
      </main>
    )
  }

  const ads = await getTopAdsForBusiness(host.id, 3)
  const ROW_TINTS = ['#FFE3E8', '#FFF3D1']

  return (
    <main className="min-h-full flex flex-col bg-[#FFF8EC] px-4 py-8">
      <div className="max-w-sm mx-auto w-full">
        <div className="flex justify-center mb-6">
          <SiteLogo className="h-20" />
        </div>

        <div className="text-center mb-6">
          <p className="text-xs uppercase tracking-wide text-[#8A76BE] font-semibold mb-1">
            You&apos;re at
          </p>
          <h1 className="font-[family-name:var(--font-baloo)] text-2xl font-bold text-[#2E1065]">{host.name}</h1>
        </div>

        <AddToWalletMembershipButton businessId={host.id} />

        {ads.length === 0 ? (
          <p className="text-sm text-[#6B5A8C] text-center py-12">
            No offers nearby right now — check back later.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {ads.map((ad, i) => (
              <div
                key={ad.campaignId}
                className="rounded-2xl p-4"
                style={{ background: ROW_TINTS[i % ROW_TINTS.length] }}
              >
                {ad.creatorName && (
                  <p className="text-xs text-[#6B5A8C] font-medium mb-1">{ad.creatorName}</p>
                )}
                <h2 className="font-semibold text-[#2E1065] mb-1">{ad.title}</h2>
                {ad.description && (
                  <p className="text-sm text-[#6B5A8C] mb-3">{ad.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
