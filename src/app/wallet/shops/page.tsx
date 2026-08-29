import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verifyMemberToken } from '@/lib/wallet/member-token'
import type { NearbyBusiness } from '@/lib/wallet/nearby-businesses'
import NearbyShopsView from '@/components/NearbyShopsView'

export const dynamic = 'force-dynamic'

// Every non-frozen shop within the member's own push radius, offer or not —
// see nearby_businesses() (supabase/migrations/20260829b_nearby_businesses.sql).
// Distinct from src/app/offers/nearby, which only ever lists shops that
// currently have an active offer. Linked from the Wallet card's "Change
// language" confirmation page (WalletLanguagePicker.tsx), which otherwise
// left a customer on a dead-end screen with nothing to do next — same
// signed-member-token scheme as every other page reached from the pass, so
// no login is needed here either.
const SHOPS_PAGE_LIMIT = 50

export default async function NearbyShopsPage({
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

  const { data: shops } = await supabaseAdmin.rpc('nearby_businesses', {
    p_lat: member.home_lat,
    p_lng: member.home_lng,
    p_radius_km: member.push_radius_km,
    p_limit: SHOPS_PAGE_LIMIT,
  })

  return <NearbyShopsView shops={(shops ?? []) as NearbyBusiness[]} />
}
