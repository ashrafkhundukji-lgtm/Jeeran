'use client'

import { useLocale } from '@/lib/i18n/useLocale'
import { getDir, type Locale } from '@/lib/i18n/locale'
import { OFFER_PAGE_COPY } from '@/lib/i18n/offers'
import { CATEGORY_LABELS } from '@/lib/categories'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import SiteLogo from '@/components/SiteLogo'

// Same brand tokens as LandingPage.tsx: #FBFCFD canvas, #1a1a1a ink,
// Archivo for display type, #FF6B4A accent.
const ARCHIVO = 'font-[family-name:var(--font-archivo)]'

// Split from the server page.tsx (src/app/offers/[campaignId]/page.tsx)
// purely because useLocale() (localStorage-backed) and LanguageSwitcher are
// client-only — same ProfileView/ProfileForm split already used for the
// dashboard. All data (campaign/business/derived URLs) is fetched
// server-side and passed down as plain props; this component only owns
// locale state and rendering. Offer title/description/business name are
// NEVER run through the locale copy — same reasoning already established
// for the Wallet card and everywhere else in this app: that's whatever the
// shop typed, in whatever language, not something we translate.
export default function OfferPageView({
  isActive,
  imageUrl,
  businessName,
  category,
  content,
  directionsUrl,
  whatsappUrl,
  callUrl,
}: {
  isActive: boolean
  imageUrl: string | null
  businessName: string
  category: string
  // Pre-resolved per-locale title/description — see the fallback chain
  // (shop translation > fresh auto-translation cache > original text)
  // documented in the server page.tsx. Resolved server-side because locale
  // itself is only known client-side (useLocale is localStorage-backed).
  content: Record<Locale, { title: string; description: string | null }>
  directionsUrl: string | null
  whatsappUrl: string | null
  callUrl: string | null
}) {
  const [locale, setLocale] = useLocale()
  const copy = OFFER_PAGE_COPY[locale]
  const dir = getDir(locale)
  const categoryLabel = CATEGORY_LABELS[locale][category] ?? category
  const { title, description } = content[locale]

  return (
    <main dir={dir} className="min-h-screen bg-[#FBFCFD] text-[#1a1a1a]">
      <header className="mx-auto flex max-w-[720px] items-center justify-between px-6 pt-8 sm:px-8">
        <SiteLogo className="h-12" />
        <LanguageSwitcher locale={locale} onChange={setLocale} />
      </header>

      <div className="mx-auto max-w-[720px] px-6 pt-10 pb-20 sm:px-8">
        {!isActive && (
          <div className="mb-8 rounded-xl border border-neutral-200 bg-white px-5 py-4 text-sm text-[#5a5a5a]">
            {copy.inactiveNotice(businessName)}
          </div>
        )}

        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={title} className="mb-8 aspect-[16/10] w-full rounded-2xl object-cover" />
        ) : (
          <div className="mb-8 flex aspect-[16/10] w-full items-center justify-center rounded-2xl bg-gradient-to-br from-[#1E3A8A] to-[#3B5BC4]">
            <span className={`${ARCHIVO} text-3xl font-black text-white/90`}>{businessName}</span>
          </div>
        )}

        <p className="mb-2 text-xs font-medium tracking-wide text-[#6b6b6b] uppercase">{categoryLabel}</p>
        <h1 className={`${ARCHIVO} mb-2 text-[32px] font-black leading-[1.05] tracking-[-0.01em] sm:text-[40px]`}>
          {title}
        </h1>
        <p className="mb-6 text-[15px] font-medium text-[#1E3A8A]">{copy.atBusiness(businessName)}</p>

        {description && (
          <p className="mb-8 max-w-[560px] text-[17px] leading-[1.6] text-[#5a5a5a]">{description}</p>
        )}

        <div className="mb-6 rounded-2xl border border-[#FF6B4A]/25 bg-[#FFF7F3] px-6 py-5">
          <div className="mb-1 h-1.5 w-10 rounded-full bg-[#FF6B4A]" />
          <p className="text-[15px] font-semibold text-[#1a1a1a]">{copy.howToRedeem}</p>
          <p className="text-sm leading-relaxed text-[#5a5a5a]">{copy.redeemBody(businessName)}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          {directionsUrl && (
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-[10px] bg-[#1E3A8A] px-7 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-[#16306e]"
            >
              {copy.getDirections}
            </a>
          )}
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-[10px] border border-[#25D366]/40 bg-[#25D366]/10 px-7 py-3.5 text-[15px] font-semibold text-[#128C4A] transition-colors hover:bg-[#25D366]/20"
            >
              {copy.whatsapp}
            </a>
          )}
          {callUrl && (
            <a
              href={callUrl}
              className="inline-block rounded-[10px] border border-neutral-200 bg-white px-7 py-3.5 text-[15px] font-semibold text-[#1a1a1a] transition-colors hover:bg-neutral-50"
            >
              {copy.call}
            </a>
          )}
        </div>
      </div>
    </main>
  )
}
