'use client'

import { useState } from 'react'
import { useLocale } from '@/lib/i18n/useLocale'
import { getDir } from '@/lib/i18n/locale'
import { CUSTOMER_UI_COPY } from '@/lib/i18n/customerUi'
import { CATEGORY_LABELS } from '@/lib/categories'
import CustomerPage from '@/components/customer/CustomerPage'
import AppHeader, { useGeoPermission } from '@/components/customer/AppHeader'
import BottomNav, { NAV_CLEARANCE } from '@/components/customer/BottomNav'
import SearchField from '@/components/customer/SearchField'
import OfferCard, { type CardOffer } from '@/components/customer/OfferCard'
import { CategoryIcon, ChevronForwardIcon, PinIcon, WalletIcon } from '@/components/customer/icons'
import { DiscountBadge, DistanceText, PRESS } from '@/components/customer/primitives'
import { GeoDeniedState, NoOffersState } from '@/components/customer/States'

// The four quick-filter wells on Home (artboard Main.dc.html). Each opens
// the Offers tab pre-filtered to that category.
const HOME_CATEGORIES = ['cafe', 'salon', 'dry-clean', 'auto']

// The Home tab. The navy hero is the SAME top offer on the member's
// physical Wallet card (the server page resolves it via the identical
// nearby_active_offers() ranking), so this reads as "your card, in the
// browser". The "featured near you" strip is the same rows, same order.
// Search hands off to the Shops tab (?q=), which searches beyond the radius.
export default function WalletHomeView({
  token,
  offers,
  otherCount,
}: {
  token: string
  offers: CardOffer[]
  otherCount: number
}) {
  const [locale] = useLocale()
  const dir = getDir(locale)
  const copy = CUSTOMER_UI_COPY[locale]
  const q = `?token=${encodeURIComponent(token)}`
  const geo = useGeoPermission()
  // Only explain a denial the customer just ran into — not on every visit.
  const [askedGeo, setAskedGeo] = useState(false)
  const topOffer = offers[0] ?? null

  function requestGeo() {
    setAskedGeo(true)
    geo.request()
  }

  return (
    <CustomerPage dir={dir} lang={locale} clearance={NAV_CLEARANCE}>
      <div className="flex flex-col gap-4 px-6 pt-5">
        <AppHeader locale={locale} geo={geo.state} onRequestGeo={requestGeo} />

        {askedGeo && geo.state === 'denied' && <GeoDeniedState locale={locale} onRetry={geo.request} />}

        <div className="flex flex-col gap-1">
          <h1 className="font-display text-[30px] leading-[1.25] font-bold text-brand-navy-deep">{copy.home.greeting}</h1>
          <p className="text-base text-brand-muted">{copy.home.sub}</p>
        </div>

        <form action="/wallet/shops" method="get" role="search">
          <input type="hidden" name="token" value={token} />
          <SearchField name="q" required minLength={2} label={copy.home.searchLabel} placeholder={copy.home.searchPlaceholder} />
        </form>

        {topOffer ? (
          <a
            href={topOffer.href}
            className={`bg-brand-hero relative block min-h-[188px] overflow-hidden rounded-3xl text-white shadow-brand-hero ${PRESS}`}
          >
            <div aria-hidden="true" className="absolute -start-[46px] -top-[46px] h-40 w-40 rounded-full bg-white/8" />
            <div aria-hidden="true" className="absolute -end-[34px] -bottom-[60px] h-[150px] w-[150px] rounded-full bg-brand-coral-brand/28" />
            <div className="relative flex min-h-[188px] flex-col justify-between gap-3 px-5 py-[18px]">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-[13px] font-semibold text-white/88">
                  <WalletIcon size={18} />
                  {copy.home.cardLabel}
                </span>
                <DiscountBadge title={topOffer.title} locale={locale} size="md" className="text-sm" />
              </div>
              <div className="flex flex-col gap-1.5">
                <span dir="auto" className="text-start text-sm font-medium text-white/82">
                  {topOffer.businessName}
                </span>
                <span dir="auto" className="line-clamp-2 text-start font-display text-[22px] leading-[1.35] font-bold">
                  {topOffer.title}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-[13px] font-semibold">
                {topOffer.distanceKm != null && (
                  <span className="flex items-center gap-1 rounded-full bg-white/16 px-2.5 py-1">
                    <PinIcon size={14} strokeWidth={2.2} />
                    <span>
                      <DistanceText km={topOffer.distanceKm} locale={locale} />
                    </span>
                  </span>
                )}
                {otherCount > 0 && <span className="text-white/88">{copy.home.moreOnCard(otherCount)}</span>}
              </div>
            </div>
          </a>
        ) : (
          <NoOffersState locale={locale} />
        )}

        <nav aria-label={copy.home.categoriesLabel} className="flex justify-between gap-2.5">
          {HOME_CATEGORIES.map((c) => (
            <a
              key={c}
              href={`/offers/nearby${q}&category=${c}`}
              className={`flex min-w-0 flex-1 flex-col items-center gap-2 ${PRESS}`}
            >
              <span className="flex h-[60px] w-[60px] items-center justify-center rounded-[20px] bg-brand-tint text-brand-navy">
                <CategoryIcon category={c} size={28} />
              </span>
              <span className="truncate text-[13px] font-semibold">{CATEGORY_LABELS[locale][c]}</span>
            </a>
          ))}
        </nav>

        {offers.length > 0 && (
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-brand-navy-deep">{copy.home.featured}</h2>
              <a
                href={`/offers/nearby${q}`}
                className="-me-2 flex min-h-[44px] items-center gap-0.5 px-2 text-sm font-semibold text-brand-coral"
              >
                {copy.viewAll}
                <ChevronForwardIcon size={18} strokeWidth={2.2} />
              </a>
            </div>
            <div className="-mx-6 flex gap-3 overflow-x-auto px-6 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {offers.map((o) => (
                <OfferCard key={o.id} offer={o} variant="compact" locale={locale} />
              ))}
            </div>
          </section>
        )}
      </div>

      <BottomNav token={token} active="home" />
    </CustomerPage>
  )
}
