import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase-admin'
import OfferPageView from '@/components/OfferPageView'

export const dynamic = 'force-dynamic'

// Full design freedom here, unlike the Wallet card itself — this is where
// the "View offer" link (see offersToLinksModule in
// src/lib/wallet/google-membership-pass.ts) sends the customer for the
// fuller experience the card's fixed template can't provide (a real image,
// real layout, a proper redemption reminder, and now a language switcher —
// see OfferPageView.tsx for why the actual rendering lives in a client
// component split off from this one).
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
    .select('id, name, category, latitude, longitude, phone, whatsapp')
    .eq('id', campaign.creator_id)
    .maybeSingle()

  if (!business) notFound()

  const directionsUrl =
    business.latitude != null && business.longitude != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${business.latitude},${business.longitude}`
      : null

  // tel: hrefs tolerate spaces/dashes/parens as typed — no sanitizing needed.
  const callUrl = business.phone ? `tel:${business.phone}` : null

  // wa.me requires a bare digit string (no spaces/+/leading zeros) — sanitized
  // here at render time rather than at write time, so /api/profile can store
  // (and the dashboard form can show back) exactly what the shop typed. See
  // supabase/migrations/20260822_business_contact.sql.
  const whatsappDigits = business.whatsapp?.replace(/\D/g, '') || null
  const whatsappUrl = whatsappDigits ? `https://wa.me/${whatsappDigits}` : null

  return (
    <OfferPageView
      isActive={campaign.is_active}
      imageUrl={campaign.image_url}
      businessName={business.name}
      category={business.category}
      title={campaign.title}
      description={campaign.description}
      directionsUrl={directionsUrl}
      whatsappUrl={whatsappUrl}
      callUrl={callUrl}
    />
  )
}
