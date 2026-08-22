import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verifyMemberToken } from '@/lib/wallet/member-token'
import { MAX_OFFERS_SHOWN, type NearbyOffer } from '@/lib/wallet/google-membership-pass'
import SiteLogo from '@/components/SiteLogo'

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

const ARCHIVO = 'font-[family-name:var(--font-archivo)]'

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

  return (
    <main className="min-h-screen bg-[#FBFCFD] text-[#1a1a1a]">
      <header className="mx-auto flex max-w-[720px] items-center px-6 pt-8 sm:px-8">
        <SiteLogo className="h-12" />
      </header>

      <div className="mx-auto max-w-[720px] px-6 pt-10 pb-20 sm:px-8">
        <h1 className={`${ARCHIVO} mb-2 text-[28px] font-black leading-[1.05] tracking-[-0.01em] sm:text-[34px]`}>
          Other offers nearby
        </h1>
        <p className="mb-8 text-[15px] text-[#5a5a5a]">More deals from shops near you, right now.</p>

        {otherOffers.length === 0 ? (
          <p className="text-sm text-neutral-500">No other offers nearby right now — check back later.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {otherOffers.map((o) => (
              <a
                key={o.offer_id}
                href={`/offers/${o.offer_id}`}
                className="block rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-colors hover:border-[#FF6B4A]/40"
              >
                <p className="mb-1 text-xs text-neutral-400">{o.business_name}</p>
                <h2 className="mb-1 font-medium text-[#1a1a1a]">{o.offer_title}</h2>
                <p className="text-sm text-neutral-500">{o.distance_km.toFixed(1)} km away</p>
              </a>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
