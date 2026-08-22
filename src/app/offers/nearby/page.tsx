import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verifyMemberToken } from '@/lib/wallet/member-token'
import { MAX_OFFERS_SHOWN, type NearbyOffer } from '@/lib/wallet/google-membership-pass'
import NearbyOffersView from '@/components/NearbyOffersView'

export const dynamic = 'force-dynamic'

// Reachable only from the Wallet card's "Other offers nearby" link (see
// offersToLinksModule in google-membership-pass.ts) — that link only ever
// appears when the card's own capped list (p_limit: 5 everywhere it's
// fetched) had more rows than fit on the card (MAX_OFFERS_SHOWN, currently
// 2). This page does its OWN fresh, higher-limit query rather than reusing
// whatever was embedded on the card at last patch time — the card's list
// would undercount once a dense area has more active campaigns than its
// own p_limit, and campaigns can go active/inactive between card patches.
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

  // Skip whatever's already on the card's front (same ranking, same
  // MAX_OFFERS_SHOWN cap) so this page is genuinely "everything ELSE," not a
  // reprint of what the customer already saw before tapping through.
  const otherOffers = ((offers ?? []) as NearbyOffer[]).slice(MAX_OFFERS_SHOWN)

  return <NearbyOffersView otherOffers={otherOffers} />
}
