import type { Locale } from './i18n/locale'

export const CATEGORIES = ['cafe', 'salon', 'dry-clean', 'hardware', 'auto', 'other']

// Display labels only — the stored value (and anything filtering/comparing
// by category, e.g. browse_businesses_by_category, get_top_ads) stays the
// plain English key above.
// Per-category emoji, for a visual category icon (e.g. the "Other offers
// nearby" list, src/components/NearbyOffersView.tsx) — one universal set,
// not per-locale, since emoji don't need translation.
export const CATEGORY_EMOJI: Record<string, string> = {
  cafe: '☕',
  salon: '💇',
  'dry-clean': '🧺',
  hardware: '🔧',
  auto: '🚗',
  other: '🏪',
}

export const CATEGORY_LABELS: Record<Locale, Record<string, string>> = {
  en: {
    cafe: 'Cafe',
    salon: 'Salon',
    'dry-clean': 'Dry Clean',
    hardware: 'Hardware',
    auto: 'Auto',
    other: 'Other',
  },
  ar: {
    cafe: 'مقهى',
    salon: 'صالون',
    'dry-clean': 'تنظيف جاف',
    hardware: 'أدوات ومعدات',
    auto: 'سيارات',
    other: 'أخرى',
  },
  ur: {
    cafe: 'کیفے',
    salon: 'سیلون',
    'dry-clean': 'ڈرائی کلین',
    hardware: 'ہارڈ ویئر',
    auto: 'آٹو',
    other: 'دیگر',
  },
}
