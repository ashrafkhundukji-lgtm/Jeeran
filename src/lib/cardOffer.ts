import type { NearbyOffer } from './wallet/google-membership-pass'
import type { CardOffer } from '@/components/customer/OfferCard'
import type { BusinessImages } from './businessImages'

// nearby_active_offers() row → the OfferCard shape. Pure mapping; order is
// whatever the caller passes in (never re-sorted here). `images` (optional)
// adds the shop's logo to the avatar, and its cover as the background for
// an offer with no photo of its own.
export function nearbyOfferToCard(
  o: NearbyOffer,
  token: string | undefined,
  endDates: Map<string, string | null>,
  images?: Map<string, BusinessImages>,
): CardOffer {
  const shop = images?.get(o.business_id)
  return {
    id: o.offer_id,
    href: token ? `/offers/${o.offer_id}?token=${encodeURIComponent(token)}` : `/offers/${o.offer_id}`,
    title: o.offer_title,
    businessName: o.business_name,
    category: o.business_category,
    distanceKm: o.distance_km,
    imageUrl: o.offer_image_url ?? shop?.coverUrl ?? null,
    businessLogoUrl: shop?.logoUrl ?? null,
    endDate: endDates.get(o.offer_id) ?? null,
  }
}
