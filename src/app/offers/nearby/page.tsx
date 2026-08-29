import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verifyMemberToken } from '@/lib/wallet/member-token'
import type { NearbyOffer } from '@/lib/wallet/google-membership-pass'
import NearbyOffersView from '@/components/NearbyOffersView'

export const dynamic = 'force-dynamic'

// The Offers tab (WalletTabBar) — a top-level destination now, not a
// "everything else beyond the card" supplement to it. It used to slice off
// the first MAX_OFFERS_SHOWN results (whatever the card's own front
// already showed) on the theory that this page only existed as a
// "more" link the card itself provided; now that it's reached directly
// from a persistent tab bar on every wallet page, slicing those off meant
// a member with only 1-2 nearby offers total saw an empty "no offers"
// list here even while their card (and the Home tab) showed one — a real
// customer hit exactly that. Shows the FULL nearby list instead, same
// query, no slice. Still does its OWN fresh, higher-limit query rather
// than reusing whatever was embedded on the card at last patch time — the
// card's own list (p_limit: 5 everywhere it's fetched) would undercount
// once a dense area has more active campaigns than that, and campaigns can
// go active/inactive between card patches.
const NEARBY_PAGE_LIMIT = 20

export default async function NearbyOffersPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  if (!token) notFound()

  // Identifies the member via the same signed-token scheme already used for
  // the pass's own redemption barcode (verifyMemberToken/signMemberToken) —
  // not a raw memberId or raw lat/lng in the URL, both of which would
  // otherwise sit in browser history/referrers for a link a customer might
  // screenshot or forward. Tampered/expired-format tokens just 404, same as
  // an unknown campaignId on the sibling offer page.
  const decoded = verifyMemberToken(token)
  if (!decoded) notFound()

  const { data: member } = await supabaseAdmin
    .from('wallet_members')
    .select('home_lat, home_lng, push_radius_km')
    .eq('id', decoded.memberId)
    .maybeSingle()
  if (!member) notFound()

  const { data: offers } = await supabaseAdmin.rpc('nearby_active_offers', {
    p_lat: member.home_lat,
    p_lng: member.home_lng,
    p_radius_km: member.push_radius_km,
    p_limit: NEARBY_PAGE_LIMIT,
  })

  const nearbyOffers = (offers ?? []) as NearbyOffer[]

  return <NearbyOffersView offers={nearbyOffers} token={token} />
}
