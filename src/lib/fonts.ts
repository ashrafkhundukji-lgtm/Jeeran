import { Archivo, Noto_Kufi_Arabic, Work_Sans } from 'next/font/google'

// Site-wide type system. Weights/subsets mirror the Claude Design source
// spec (docs/Jeeran Landing Redesign - Standalone.html): Archivo carries
// display type (500/700/900), Work Sans carries body copy (400/500/600).
// Loaded once here and applied on the root <html> so every page shares the
// same font instances — next/font downloads these at build time and serves
// them from our own domain (self-hosted, no runtime requests to Google).
export const archivo = Archivo({
  subsets: ['latin', 'latin-ext', 'vietnamese'],
  weight: ['500', '700', '900'],
  variable: '--font-archivo',
  display: 'swap',
})

// Archivo has no Arabic glyphs, so any Arabic text set in it falls back to
// a system sans and gets browser-synthesized ("fake") bold — most visible
// on font-black display headlines. Noto Kufi Arabic is Archivo's
// geometric-sans counterpart for Arabic script and carries a real weight
// per step, so display type stays a true face in Arabic instead of a faux
// one. Scoped to 'ar' only — Urdu (also Arabic-script) reads better in a
// Naskh/Nastaliq style than Kufi, so it isn't part of this fix.
export const notoKufiArabic = Noto_Kufi_Arabic({
  subsets: ['arabic'],
  weight: ['500', '700', '900'],
  variable: '--font-noto-kufi-arabic',
  display: 'swap',
})

export const workSans = Work_Sans({
  subsets: ['latin', 'latin-ext', 'vietnamese'],
  weight: ['400', '500', '600'],
  variable: '--font-work-sans',
  display: 'swap',
})
