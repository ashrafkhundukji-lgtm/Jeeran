/**
 * Resolves per-offer title/description into a member's chosen wallet
 * language — mirrors the EXACT same fallback chain the offer landing page
 * already uses (src/app/offers/[campaignId]/page.tsx): shop-provided
 * override (campaigns.title_{locale}/description_{locale}) > a FRESH
 * auto-translation cache row (campaign_auto_translations — source_updated_at
 * must match the offer's current offer_updated_at, otherwise the shop edited
 * content since it was generated and it's ignored) > the original
 * title/description as typed.
 *
 * Only ever called once a member has an explicit preferred_language set
 * (see wallet_members.preferred_language) — with no preference, the Wallet
 * card keeps showing raw shop-typed text and lets Google's own
 * LocalizedString auto-detection handle the fixed chrome only (see
 * google-membership-pass.ts). business_name is deliberately NOT resolved
 * here, same reasoning as the offer page: it's a shop name, not content
 * anyone maintains a translation of.
 */

import { supabaseAdmin } from '@/lib/supabase-admin'
import type { Locale } from '@/lib/i18n/locale'
import type { NearbyOffer } from './google-membership-pass'

export interface ResolvedOfferContent {
  title: string
  description: string | null
}

export async function resolveOfferContent(
  offers: NearbyOffer[],
  locale: Locale,
): Promise<Map<string, ResolvedOfferContent>> {
  const result = new Map<string, ResolvedOfferContent>()
  if (!offers.length) return result

  const { data: autoRows, error } = await supabaseAdmin
    .from('campaign_auto_translations')
    .select('campaign_id, title, description, source_updated_at')
    .eq('locale', locale)
    .in(
      'campaign_id',
      offers.map((o) => o.offer_id),
    )

  if (error) {
    console.error('resolveOfferContent: campaign_auto_translations lookup failed', { locale, error })
  }
  const autoByOfferId = new Map((autoRows ?? []).map((r) => [r.campaign_id, r]))

  for (const o of offers) {
    const shopTitle = locale === 'ar' ? o.title_ar : locale === 'ur' ? o.title_ur : o.title_en
    const shopDescription = locale === 'ar' ? o.description_ar : locale === 'ur' ? o.description_ur : o.description_en
    const auto = autoByOfferId.get(o.offer_id)
    const autoFresh = auto && auto.source_updated_at === o.offer_updated_at

    result.set(o.offer_id, {
      title: shopTitle || (autoFresh ? auto.title : o.offer_title),
      description: shopDescription || (autoFresh ? auto.description : o.offer_description),
    })
  }
  return result
}
