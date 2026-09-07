import type { Locale } from './locale'

// Reused verbatim wherever this is applied — kept as literal strings so
// Tailwind's content scanner sees the full arbitrary-value class names.
const ARCHIVO = 'font-[family-name:var(--font-archivo)]'
const NOTO_KUFI_ARABIC = 'font-[family-name:var(--font-noto-kufi-arabic)]'

// Archivo has no Arabic glyphs (see src/lib/fonts.ts), so any *locale text*
// rendered in it under 'ar' falls back to a synthesized fake bold. Swap to
// the real Arabic display face there. Only for text that actually varies by
// locale — shop-typed content (business names, campaign titles/descriptions
// before translation) or illustrative mock content keeps plain Archivo
// regardless of locale. Originally written inline in LandingPage.tsx; moved
// here once the wallet-linked pages (WalletHomeView, NearbyOffersView,
// NearbyShopsView, WalletLanguagePicker, OfferPageView) needed the same fix —
// BUGS.md item 5 always said this covered "every ARCHIVO heading in the
// wallet views," this just finishes applying it there.
export function displayFont(locale: Locale): string {
  return locale === 'ar' ? NOTO_KUFI_ARABIC : ARCHIVO
}
