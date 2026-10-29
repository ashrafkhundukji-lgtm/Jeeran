import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verifyMemberToken } from '@/lib/wallet/member-token'
import type { NearbyOffer } from '@/lib/wallet/google-membership-pass'
import WalletHomeView from '@/components/WalletHomeView'
import WalletLocaleSync from '@/components/WalletLocaleSync'
import { fetchOfferEndDates } from '@/lib/offerEndDates'
import { nearbyOfferToCard } from '@/lib/cardOffer'
import { fetchBusinessImages } from '@/lib/businessImages'

export const dynamic = 'force-dynamic'

// The Home tab — reached from BottomNav on every other wallet page, and
// (via the Wallet card's own links, all of which now carry ?token=) the
// natural first stop. Resolves the member's top offer via the SAME
// nearby_active_offers() ranking offersToTextModules (google-membership-pass.ts)
// uses for the physical card, so this shows the identical offer, not a
// second opinion — see WalletHomeView's own header comment.
export default async function WalletHomePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  if (!token) notFound()

  const decoded = verifyMemberToken(token)
  if (!decoded) notFound()

  const { data: member } = await supabaseAdmin
    .from('wallet_members')
    .select('home_lat, home_lng, push_radius_km, preferred_language')
    .eq('id', decoded.memberId)
    .maybeSingle()
  if (!member) notFound()

  const { data: offers } = await supabaseAdmin.rpc('nearby_active_offers', {
    p_lat: member.home_lat,
    p_lng: member.home_lng,
    p_radius_km: member.push_radius_km,
    p_limit: 5,
  })
  const nearbyOffers = (offers ?? []) as NearbyOffer[]
  const [endDates, images] = await Promise.all([
    fetchOfferEndDates(nearbyOffers.map((o) => o.offer_id)),
    fetchBusinessImages(nearbyOffers.map((o) => o.business_id)),
  ])

  // The hero is the card's own top offer; the "featured near you" strip is
  // the same 5 rows in the same order (no extra query, no reorder).
  return (
    <>
      <WalletLocaleSync preferred={member.preferred_language} />
      <WalletHomeView
        token={token}
        radiusKm={Number(member.push_radius_km)}
        offers={nearbyOffers.map((o) => nearbyOfferToCard(o, token, endDates, images))}
        otherCount={Math.max(nearbyOffers.length - 1, 0)}
      />
    </>
  )
}
