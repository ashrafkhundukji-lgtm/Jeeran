import { notFound } from 'next/navigation'
import { after } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { regenerateAutoTranslations } from '@/lib/translate'
import type { Locale } from '@/lib/i18n/locale'
import OfferPageView from '@/components/OfferPageView'

export const dynamic = 'force-dynamic'

const LOCALES: Locale[] = ['ar', 'en', 'ur']

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
    .select(
      'id, title, description, image_url, is_active, creator_type, creator_id, updated_at, title_ar, title_en, title_ur, description_ar, description_en, description_ur',
    )
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

  // Per-locale title/description, resolved server-side so the client
  // component (locale is only known client-side, via localStorage — see
  // OfferPageView.tsx) never needs its own data fetch. Fallback chain per
  // field: shop-provided translation (supabase/migrations/
  // 20260822b_campaign_translations.sql) > a FRESH auto-translation cache
  // row (source_updated_at must match the campaign's current updated_at —
  // a stale one means the shop edited title/description since it was
  // generated, so it's ignored rather than shown as if current) > the
  // original text as typed. The original is always a safe fallback in every
  // locale — never blank, never "translation unavailable."
  const { data: autoRows } = await supabaseAdmin
    .from('campaign_auto_translations')
    .select('locale, title, description, source_updated_at')
    .eq('campaign_id', campaign.id)

  const autoByLocale = new Map((autoRows ?? []).map((r) => [r.locale, r]))

  const resolved = LOCALES.map((locale) => {
    const shopTitle = campaign[`title_${locale}` as const]
    const shopDescription = campaign[`description_${locale}` as const]
    const auto = autoByLocale.get(locale)
    const autoFresh = auto && auto.source_updated_at === campaign.updated_at

    return {
      locale,
      needsBackfill: !shopTitle && !autoFresh,
      title: shopTitle ?? (autoFresh ? auto.title : campaign.title),
      description: shopDescription ?? (autoFresh ? auto.description : campaign.description),
    }
  })

  const content = Object.fromEntries(
    resolved.map((r) => [r.locale, { title: r.title, description: r.description }]),
  ) as Record<Locale, { title: string; description: string | null }>

  // Self-healing backfill: this specific request still renders the safe
  // fallback text above immediately (never blocks on the LLM call) — this
  // just kicks off generation in the background so the NEXT view of this
  // campaign (in whichever locale was missing a fresh translation) has it
  // cached. Covers both campaigns created before this feature existed and
  // the rare case where the create/edit-triggered generation failed.
  if (resolved.some((r) => r.needsBackfill)) {
    after(() => regenerateAutoTranslations(campaign.id, campaign.title, campaign.description, campaign.updated_at))
  }

  return (
    <OfferPageView
      isActive={campaign.is_active}
      imageUrl={campaign.image_url}
      businessName={business.name}
      category={business.category}
      content={content}
      directionsUrl={directionsUrl}
      whatsappUrl={whatsappUrl}
      callUrl={callUrl}
    />
  )
}
