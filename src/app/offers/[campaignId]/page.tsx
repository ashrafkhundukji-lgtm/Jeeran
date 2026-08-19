import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase-admin'
import SiteLogo from '@/components/SiteLogo'

export const dynamic = 'force-dynamic'

// Full design freedom here, unlike the Wallet card itself — this is where
// the "View offer" link (see offersToLinksModule in
// src/lib/wallet/google-membership-pass.ts) sends the customer for the
// fuller experience the card's fixed template can't provide (a real image,
// real layout, a proper redemption reminder). Reuses the landing-page
// redesign's brand tokens (src/components/LandingPage.tsx): #FBFCFD
// canvas, #1a1a1a ink, Archivo for display type, #FF6B4A accent — not the
// plainer /scan page's styling, which predates that redesign.
const ARCHIVO = 'font-[family-name:var(--font-archivo)]'

export default async function OfferPage({
  params,
}: {
  params: Promise<{ campaignId: string }>
}) {
  const { campaignId } = await params

  const { data: campaign } = await supabaseAdmin
    .from('campaigns')
    .select('id, title, description, image_url, is_active, creator_type, creator_id')
    .eq('id', campaignId)
    .eq('creator_type', 'business') // matches the rest of the geo-push/membership system — business-only for MVP
    .maybeSingle()

  if (!campaign) notFound()

  const { data: business } = await supabaseAdmin
    .from('businesses')
    .select('id, name, category, latitude, longitude')
    .eq('id', campaign.creator_id)
    .maybeSingle()

  if (!business) notFound()

  const directionsUrl =
    business.latitude != null && business.longitude != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${business.latitude},${business.longitude}`
      : null

  return (
    <main className="min-h-screen bg-[#FBFCFD] text-[#1a1a1a]">
      <header className="mx-auto flex max-w-[720px] items-center px-6 pt-8 sm:px-8">
        <SiteLogo className="h-12" />
      </header>

      <div className="mx-auto max-w-[720px] px-6 pt-10 pb-20 sm:px-8">
        {!campaign.is_active && (
          <div className="mb-8 rounded-xl border border-neutral-200 bg-white px-5 py-4 text-sm text-[#5a5a5a]">
            This offer isn&apos;t currently active — check back soon, or see what else{' '}
            <span className="font-medium text-[#1a1a1a]">{business.name}</span> has running.
          </div>
        )}

        {campaign.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={campaign.image_url}
            alt={campaign.title}
            className="mb-8 aspect-[16/10] w-full rounded-2xl object-cover"
          />
        ) : (
          <div className="mb-8 flex aspect-[16/10] w-full items-center justify-center rounded-2xl bg-gradient-to-br from-[#1E3A8A] to-[#3B5BC4]">
            <span className={`${ARCHIVO} text-3xl font-black text-white/90`}>{business.name}</span>
          </div>
        )}

        <p className="mb-2 text-xs font-medium tracking-wide text-[#6b6b6b] uppercase">{business.category}</p>
        <h1 className={`${ARCHIVO} mb-2 text-[32px] font-black leading-[1.05] tracking-[-0.01em] sm:text-[40px]`}>
          {campaign.title}
        </h1>
        <p className="mb-6 text-[15px] font-medium text-[#1E3A8A]">at {business.name}</p>

        {campaign.description && (
          <p className="mb-8 max-w-[560px] text-[17px] leading-[1.6] text-[#5a5a5a]">{campaign.description}</p>
        )}

        <div className="mb-6 rounded-2xl border border-[#FF6B4A]/25 bg-[#FFF7F3] px-6 py-5">
          <div className="mb-1 h-1.5 w-10 rounded-full bg-[#FF6B4A]" />
          <p className="text-[15px] font-semibold text-[#1a1a1a]">How to redeem</p>
          <p className="text-sm leading-relaxed text-[#5a5a5a]">
            Show your Jeeran pass to staff at {business.name} — no coupon, no code, just the pass already saved to
            your wallet.
          </p>
        </div>

        {directionsUrl && (
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-[10px] bg-[#1E3A8A] px-7 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-[#16306e]"
          >
            Get directions
          </a>
        )}
      </div>
    </main>
  )
}
