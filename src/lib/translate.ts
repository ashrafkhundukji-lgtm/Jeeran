import { supabaseAdmin } from './supabase-admin'
import type { Locale } from './i18n/locale'

const LOCALES: Locale[] = ['ar', 'en', 'ur']

// MyMemory: free, keyless machine translation API — no signup, no API key,
// no billing. Chosen deliberately over an LLM-based approach: the obvious
// path (Vercel AI Gateway + an LLM, e.g. Claude Haiku) was built first and
// verified working end-to-end, but the Gateway hard-blocks every request
// until a credit card is on file on the Vercel account, even to use the
// free monthly credits — a real account-level step only the account owner
// can do. Traded off deliberately for a genuinely free, zero-setup option
// instead; quality is real machine translation (not an LLM's grasp of tone),
// noticeably more literal than the LLM version tested before this, but
// requires nothing from the shop or the account owner.
//
// `langpair=autodetect|{target}` avoids needing to know or store which
// language the shop actually typed in — confirmed live: when the detected
// source language already equals the target, MyMemory returns an error
// ("PLEASE SELECT TWO DISTINCT LANGUAGES", responseStatus != 200) rather
// than the text unchanged. translateField() below treats ANY non-200
// response — that one included — as "fall back to the original text",
// which is the CORRECT value in that specific case anyway (the source
// already IS that language), and a safe default for a genuine failure
// (rate limit, network error) too.
async function translateField(text: string, locale: Locale): Promise<string> {
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=autodetect|${locale}`
    const res = await fetch(url)
    if (!res.ok) return text
    const data = await res.json()
    if (String(data.responseStatus) !== '200') return text
    return data.responseData?.translatedText || text
  } catch (err) {
    console.error('MyMemory translateField failed', { locale, err })
    return text
  }
}

export interface CampaignTranslations {
  ar: { title: string; description: string | null }
  en: { title: string; description: string | null }
  ur: { title: string; description: string | null }
}

async function translateOneLocale(
  title: string,
  description: string | null,
  locale: Locale,
): Promise<{ title: string; description: string | null }> {
  const [translatedTitle, translatedDescription] = await Promise.all([
    translateField(title, locale),
    description ? translateField(description, locale) : Promise.resolve(null),
  ])
  return { title: translatedTitle, description: translatedDescription }
}

// Always generates for all 3 locales regardless of whether the shop already
// provided an override for some of them — the READ side (offer page)
// decides per-field whether to use the shop's own text or this cache, and
// MyMemory has no meaningful per-request cost to optimize away here (unlike
// an LLM call). Destructures against LOCALES' own fixed order (['ar','en',
// 'ur']) rather than Object.fromEntries, so the return type stays exactly
// CampaignTranslations with no cast.
async function translateCampaignContent(title: string, description: string | null): Promise<CampaignTranslations> {
  const [ar, en, ur] = await Promise.all(LOCALES.map((locale) => translateOneLocale(title, description, locale)))
  return { ar, en, ur }
}

// Best-effort, non-throwing: callers fire this via after() and must never
// let a translation failure (rate limit, network error, etc.) affect the
// customer-facing request that triggered it. Upserts all 3 locale rows in
// one round trip.
export async function regenerateAutoTranslations(
  campaignId: string,
  title: string,
  description: string | null,
  updatedAt: string,
): Promise<void> {
  try {
    const translations = await translateCampaignContent(title, description)
    const { error } = await supabaseAdmin.from('campaign_auto_translations').upsert(
      LOCALES.map((locale) => ({
        campaign_id: campaignId,
        locale,
        title: translations[locale].title,
        description: translations[locale].description,
        source_updated_at: updatedAt,
      })),
      { onConflict: 'campaign_id,locale' },
    )
    if (error) console.error('campaign_auto_translations upsert failed', { campaignId, error })
  } catch (err) {
    console.error('regenerateAutoTranslations failed', { campaignId, err })
  }
}
