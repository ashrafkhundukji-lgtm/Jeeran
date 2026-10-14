import { notFound } from 'next/navigation'
import { getHostBusiness, getTopAdsForBusiness } from '@/lib/matchmaking'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { fetchOfferEndDates } from '@/lib/offerEndDates'
import { haversineKm } from '@/lib/display'
import ScanView from '@/components/ScanView'
import type { CardOffer } from '@/components/customer/OfferCard'

// Apple Wallet (SaveToWalletButton) is intentionally not rendered here — its
// add-confirmation signal isn't wired up yet (see the component's own
// comment), so it's not ready for the live scan page. Re-add the import and
// the <SaveToWalletButton /> render in ScanView once that's confirmed working.

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
    return <ScanView hostId={host.id} hostName={host.name} frozen offers={[]} />
  }

  // Ranking and selection stay entirely get_top_ads()'s. The lookups below
  // only decorate those same rows for display (category icon, photo,
  // expiry chip, distance from this shop) — they never filter or reorder.
  const ads = await getTopAdsForBusiness(host.id, 3)
  const campaignIds = ads.map((a) => a.campaignId)
  const shopIds = [host.id, ...ads.map((a) => a.creatorId)]

  const [endDates, { data: campaigns }, { data: shops }] = await Promise.all([
    fetchOfferEndDates(campaignIds),
    campaignIds.length
      ? supabaseAdmin.from('campaigns').select('id, image_url').in('id', campaignIds)
      : Promise.resolve({ data: [] as { id: string; image_url: string | null }[] }),
    supabaseAdmin.from('businesses').select('id, category, latitude, longitude').in('id', shopIds),
  ])

  const imageById = new Map((campaigns ?? []).map((c) => [c.id, c.image_url as string | null]))
  const shopById = new Map(
    (shops ?? []).map((s) => [s.id, s as { id: string; category: string; latitude: number | null; longitude: number | null }]),
  )
  const hostShop = shopById.get(host.id)

  const offers: CardOffer[] = ads.map((ad) => {
    const shop = shopById.get(ad.creatorId)
    const canMeasure = hostShop?.latitude != null && hostShop.longitude != null && shop?.latitude != null && shop.longitude != null
    return {
      id: ad.campaignId,
      href: `/offers/${ad.campaignId}`,
      title: ad.title,
      businessName: ad.creatorName ?? '',
      category: shop?.category ?? 'other',
      distanceKm: canMeasure ? haversineKm(hostShop.latitude!, hostShop.longitude!, shop.latitude!, shop.longitude!) : null,
      imageUrl: imageById.get(ad.campaignId) ?? null,
      endDate: endDates.get(ad.campaignId) ?? null,
    }
  })

  return <ScanView hostId={host.id} hostName={host.name} offers={offers} />
}
