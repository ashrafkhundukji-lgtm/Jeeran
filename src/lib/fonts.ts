import { Baloo_2, Inter, Noto_Kufi_Arabic } from 'next/font/google'

// Site-wide type system ("Vibrant Community" direction). Baloo 2 carries
// display type (600/700/800) — a playful, rounded geometric face — Inter
// carries body copy (400/500/600/700). Loaded once here and applied on the
// root <html> so every page shares the same font instances — next/font
// downloads these at build time and serves them from our own domain
// (self-hosted, no runtime requests to Google).
export const baloo2 = Baloo_2({
  subsets: ['latin', 'latin-ext', 'vietnamese'],
  weight: ['600', '700', '800'],
  variable: '--font-baloo',
  display: 'swap',
})

// Baloo 2 has no Arabic glyphs, so any Arabic text set in it falls back to
// a system sans and gets browser-synthesized ("fake") bold — most visible
// on font-black display headlines. Noto Kufi Arabic is a geometric-sans
// counterpart for Arabic script and carries a real weight per step, so
// display type stays a true face in Arabic instead of a faux one. Scoped
// to 'ar' only — Urdu (also Arabic-script) reads better in a
// Naskh/Nastaliq style than Kufi, so it isn't part of this fix.
export const notoKufiArabic = Noto_Kufi_Arabic({
  subsets: ['arabic'],
  weight: ['500', '700', '900'],
  variable: '--font-noto-kufi-arabic',
  display: 'swap',
})

export const inter = Inter({
  subsets: ['latin', 'latin-ext', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
})
