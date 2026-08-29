// Row shape for the nearby_businesses() RPC (see
// supabase/migrations/20260829b_nearby_businesses.sql) — every non-frozen
// business within radius, with or without an active offer. Distinct from
// NearbyOffer (google-membership-pass.ts), which only ever returns
// businesses that currently have one.
export interface NearbyBusiness {
  business_id: string
  business_name: string
  category: string
  distance_km: number
  business_lat: number
  business_lng: number
  phone: string | null
  whatsapp: string | null
  has_active_offer: boolean
  top_offer_id: string | null
  top_offer_title: string | null
}
