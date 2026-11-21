import type { Campaign, CampaignInput, OfferStatusReason } from './apiClient'

// Offer rules the app checks before sending, mirroring the server's checks
// in src/app/api/campaigns/route.ts and [id]/route.ts (the server stays the
// authority; these only give instant feedback).
export const BID_MIN = 2
export const BID_MAX = 10
export const BID_DEFAULT = 5
export const TITLE_MAX = 120
export const DESCRIPTION_MAX = 500

export interface OfferForm {
  title: string
  description: string
  bid: number
  startDate: string // '' = none
  endDate: string // '' = none
  imageUrl: string | null
  translations: Record<TranslationKey, string>
}

export const TRANSLATION_KEYS = ['title_ar', 'title_en', 'title_ur', 'description_ar', 'description_en', 'description_ur'] as const
export type TranslationKey = (typeof TRANSLATION_KEYS)[number]

export function formFromCampaign(c: Campaign | null): OfferForm {
  return {
    title: c?.title ?? '',
    description: c?.description ?? '',
    bid: c?.bid_per_view ?? BID_DEFAULT,
    startDate: c?.start_date ?? '',
    endDate: c?.end_date ?? '',
    // Kept as-is on edit: the API overwrites image_url and the translations
    // with whatever is sent, so the app must send the current values back.
    imageUrl: c?.image_url ?? null,
    translations: Object.fromEntries(TRANSLATION_KEYS.map((k) => [k, c?.[k] ?? ''])) as Record<TranslationKey, string>,
  }
}

export type OfferFormError = 'title_required' | 'bid_range' | 'end_before_start' | 'bad_date'

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/

export function validateOffer(f: OfferForm): OfferFormError[] {
  const errors: OfferFormError[] = []
  if (!f.title.trim()) errors.push('title_required')
  if (!Number.isFinite(f.bid) || f.bid < BID_MIN || f.bid > BID_MAX) errors.push('bid_range')
  if ((f.startDate && !DAY_RE.test(f.startDate)) || (f.endDate && !DAY_RE.test(f.endDate))) errors.push('bad_date')
  else if (f.startDate && f.endDate && f.endDate < f.startDate) errors.push('end_before_start')
  return errors
}

const blank = (s: string) => s.trim() || null

export function toCampaignInput(f: OfferForm): CampaignInput {
  return {
    title: f.title.trim(),
    description: blank(f.description),
    bid_per_view: f.bid,
    start_date: f.startDate || null,
    end_date: f.endDate || null,
    image_url: f.imageUrl,
    title_ar: blank(f.translations.title_ar),
    title_en: blank(f.translations.title_en),
    title_ur: blank(f.translations.title_ur),
    description_ar: blank(f.translations.description_ar),
    description_en: blank(f.translations.description_en),
    description_ur: blank(f.translations.description_ur),
  }
}

export function clampBid(n: number): number {
  return Math.min(BID_MAX, Math.max(BID_MIN, Math.round(n)))
}

// Offer dates are calendar days in Saudi time (src/lib/offerWindow.ts on
// the website). Saudi Arabia has no daylight saving, so UTC+3 is exact and
// avoids depending on the phone's Intl time-zone data.
const RIYADH_OFFSET_MS = 3 * 3600_000

export function offerToday(now: Date = new Date()): string {
  return new Date(now.getTime() + RIYADH_OFFSET_MS).toISOString().slice(0, 10)
}

export function addDays(day: string, days: number): string {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

export type OfferWindowState = 'live' | 'scheduled' | 'ended'

export function offerWindowState(start: string | null, end: string | null, today = offerToday()): OfferWindowState {
  if (start && start > today) return 'scheduled'
  if (end && end < today) return 'ended'
  return 'live'
}

// Active first, then newest — the order the website's offers list uses.
export function sortCampaigns(list: Campaign[]): Campaign[] {
  return [...list].sort((a, b) => Number(b.is_active) - Number(a.is_active) || b.created_at.localeCompare(a.created_at))
}

export function activeCampaign(list: Campaign[]): Campaign | null {
  return list.find((c) => c.is_active) ?? null
}

// What the Home screen offers as the next step for each "not showing" reason.
export type StatusAction = 'create' | 'switch_on' | 'edit' | 'none'

export function actionForReason(reason: OfferStatusReason | null): StatusAction {
  switch (reason) {
    case 'no_offer':
      return 'create'
    case 'switched_off':
      return 'switch_on'
    case 'not_started':
    case 'ended':
      return 'edit'
    default:
      return 'none'
  }
}

// How many views the balance pays for at this bid.
export function runway(credits: number, bid: number): number {
  return bid > 0 ? Math.floor(Math.max(0, credits) / bid) : 0
}
