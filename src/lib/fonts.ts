import localFont from 'next/font/local'

// Self-hosted from files in the repo (src/assets/fonts, SIL Open Font
// License — see the OFL-*.txt files there). No font is fetched from Google
// at build time, so a build can never fail on a stale or unreachable font
// download (the "next/font module-not-found" production build failures).
//
// Files: woff2, subset to Google Fonts' "arabic" + "latin" ranges (the same
// subsets used before). IBM Plex Sans Arabic 1.101 static weights from
// github.com/google/fonts (ofl/ibmplexsansarabic); Readex Pro static weights
// instanced (wght 500/600/700, HEXP 0) from the variable font in
// github.com/google/fonts (ofl/readexpro).
//
// Readex Pro: display. IBM Plex Sans Arabic: body/UI and the default sans.
// Both carry Latin and Arabic-script glyphs, so the pair serves ar, en and
// ur. Exposed as the `font-display` / `font-body` / `font-sans` Tailwind
// tokens (globals.css).
export const readexPro = localFont({
  src: [
    { path: '../assets/fonts/ReadexPro-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../assets/fonts/ReadexPro-SemiBold.woff2', weight: '600', style: 'normal' },
    { path: '../assets/fonts/ReadexPro-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-readex-pro',
  display: 'swap',
})

export const plexSansArabic = localFont({
  src: [
    { path: '../assets/fonts/IBMPlexSansArabic-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../assets/fonts/IBMPlexSansArabic-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../assets/fonts/IBMPlexSansArabic-SemiBold.woff2', weight: '600', style: 'normal' },
    { path: '../assets/fonts/IBMPlexSansArabic-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-plex-arabic',
  display: 'swap',
})
