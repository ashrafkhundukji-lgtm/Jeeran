import type { NearbyOffer } from './wallet/google-membership-pass'
import type { CardOffer } from '@/components/customer/OfferCard'

// nearby_active_offers() row → the OfferCard shape. Pure mapping; order is
// whatever the caller passes in (never re-sorted here).
export function nearbyOfferToCard(o: NearbyOffer, token: string | undefined, endDates: Map<string, string | null>): CardOffer {
  return {
    id: o.offer_id,
    href: token ? `/offers/${o.offer_id}?token=${encodeURIComponent(token)}` : `/offers/${o.offer_id}`,
    title: o.offer_title,
    businessName: o.business_name,
    category: o.business_category,
    distanceKm: o.distance_km,
    imageUrl: o.offer_image_url,
    endDate: endDates.get(o.offer_id) ?? null,
  }
}
