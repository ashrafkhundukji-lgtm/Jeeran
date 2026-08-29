import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verifyMemberToken } from '@/lib/wallet/member-token'
import type { NearbyOffer } from '@/lib/wallet/google-membership-pass'
import WalletHomeView from '@/components/WalletHomeView'

export const dynamic = 'force-dynamic'

// The Home tab — reached from WalletTabBar on every other wallet page, and
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
    .select('home_lat, home_lng, push_radius_km')
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

  return (
    <WalletHomeView
      token={token}
      topOffer={nearbyOffers[0] ?? null}
      otherCount={Math.max(nearbyOffers.length - 1, 0)}
    />
  )
}
