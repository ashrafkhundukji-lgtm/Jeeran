import type { Locale } from '@/lib/i18n/locale'

// Google's official "Add to Google Wallet" button, used unmodified
// (public/google-wallet/, from Google's add-to-wallet-svg.zip; enUS for
// English). The brand guidelines allow only Google's own assets — no custom
// colour, font, radius or padding — scaled proportionally, at least 48dp
// tall, with 8dp clear space
// (https://developers.google.com/wallet/generic/resources/brand-guidelines).
// The ar/ur assets are Google's own localised versions; their icon stays on
// the left in RTL by Google's design, so they are not mirrored here.
//
// Full-width primary button when the container is wide enough for it to be
// ≥48px tall (asset width × 48/50), Google's condensed button otherwise —
// which is what the guidelines say to use "if there is not enough space for
// the primary or full-width" one. Thresholds are per locale because the
// localised assets differ in width. Clear space comes from the parent's
// padding; the parent must be an `@container`.
const PRIMARY_MIN: Record<Locale, string> = {
  en: '@min-[272px]:block', // 283×50
  ar: '@min-[300px]:block', // 312×50
  ur: '@min-[317px]:block', // 330×50
}
const CONDENSED_HIDE: Record<Locale, string> = {
  en: '@min-[272px]:hidden',
  ar: '@min-[300px]:hidden',
  ur: '@min-[317px]:hidden',
}

export default function GoogleWalletBadge({ locale, alt }: { locale: Locale; alt: string }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/google-wallet/add-to-google-wallet-${locale}.svg`} alt={alt} className={`hidden h-auto w-full ${PRIMARY_MIN[locale]}`} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/google-wallet/add-to-google-wallet-condensed-${locale}.svg`}
        alt={alt}
        className={`mx-auto block h-[55px] w-auto ${CONDENSED_HIDE[locale]}`}
      />
    </>
  )
}
