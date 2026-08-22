'use client'

import { useLocale } from '@/lib/i18n/useLocale'
import { getDir } from '@/lib/i18n/locale'
import { NEARBY_OFFERS_COPY } from '@/lib/i18n/offers'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import SiteLogo from '@/components/SiteLogo'
import type { NearbyOffer } from '@/lib/wallet/google-membership-pass'

const ARCHIVO = 'font-[family-name:var(--font-archivo)]'

// Split from the server page.tsx (src/app/offers/nearby/page.tsx) for the
// same reason as OfferPageView.tsx — useLocale()/LanguageSwitcher are
// client-only. offer_title/business_name are never run through the locale
// copy — shop-typed content, same reasoning as everywhere else in this app.
export default function NearbyOffersView({ otherOffers }: { otherOffers: NearbyOffer[] }) {
  const [locale, setLocale] = useLocale()
  const copy = NEARBY_OFFERS_COPY[locale]
  const dir = getDir(locale)

  return (
    <main dir={dir} className="min-h-screen bg-[#FBFCFD] text-[#1a1a1a]">
      <header className="mx-auto flex max-w-[720px] items-center justify-between px-6 pt-8 sm:px-8">
        <SiteLogo className="h-12" />
        <LanguageSwitcher locale={locale} onChange={setLocale} />
      </header>

      <div className="mx-auto max-w-[720px] px-6 pt-10 pb-20 sm:px-8">
        <h1 className={`${ARCHIVO} mb-2 text-[28px] font-black leading-[1.05] tracking-[-0.01em] sm:text-[34px]`}>
          {copy.heading}
        </h1>
        <p className="mb-8 text-[15px] text-[#5a5a5a]">{copy.subheading}</p>

        {otherOffers.length === 0 ? (
          <p className="text-sm text-neutral-500">{copy.empty}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {otherOffers.map((o) => (
              // Each row is a real link to /offers/[campaignId] — the same
              // page top-ranked offers use, Directions/WhatsApp/Call
              // included. The chevron + explicit label + active: (press)
              // state are what actually signal "tap me" on a touchscreen,
              // which is how this page is normally opened (from the Wallet
              // card's "Other offers nearby" link) — a hover-only
              // affordance does nothing there.
              <a
                key={o.offer_id}
                href={`/offers/${o.offer_id}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-colors active:border-[#FF6B4A]/50 active:bg-[#FFF7F3]"
              >
                <div className="min-w-0">
                  <p className="mb-1 text-xs text-neutral-400">{o.business_name}</p>
                  <h2 className="mb-1 font-medium text-[#1a1a1a]">{o.offer_title}</h2>
                  <p className="text-sm text-neutral-500">{copy.kmAway(o.distance_km.toFixed(1))}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5 text-[#FF6B4A]">
                  <span className="text-sm font-semibold whitespace-nowrap">{copy.viewOffer}</span>
                  {/* Points "forward" (toward where tapping takes you) in
                      both directions — mirrored in RTL rather than relying
                      on CSS to do it, same explicit-flip convention already
                      used for the arrow glyph in BrowseCategoryView.tsx. */}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                    className={`shrink-0 ${dir === 'rtl' ? 'scale-x-[-1]' : ''}`}
                  >
                    <path
                      d="M6 3.5L10.5 8L6 12.5"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
