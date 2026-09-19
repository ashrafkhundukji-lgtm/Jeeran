import type { Locale } from './locale'

// Reused verbatim wherever this is applied — kept as literal strings so
// Tailwind's content scanner sees the full arbitrary-value class names.
const BALOO = 'font-[family-name:var(--font-baloo)]'
const NOTO_KUFI_ARABIC = 'font-[family-name:var(--font-noto-kufi-arabic)]'

// Baloo 2 has no Arabic glyphs (see src/lib/fonts.ts), so any *locale text*
// rendered in it under 'ar' falls back to a synthesized fake bold. Swap to
// the real Arabic display face there. Only for text that actually varies by
// locale — shop-typed content (business names, campaign titles/descriptions
// before translation) or illustrative mock content keeps plain Baloo 2
// regardless of locale.
export function displayFont(locale: Locale): string {
  return locale === 'ar' ? NOTO_KUFI_ARABIC : BALOO
}
