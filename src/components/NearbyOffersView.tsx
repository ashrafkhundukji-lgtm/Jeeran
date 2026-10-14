'use client'

import { useMemo, useState } from 'react'
import { useLocale } from '@/lib/i18n/useLocale'
import { getDir } from '@/lib/i18n/locale'
import { CUSTOMER_UI_COPY } from '@/lib/i18n/customerUi'
import { NEARBY_OFFERS_COPY } from '@/lib/i18n/offers'
import { CATEGORIES, CATEGORY_LABELS } from '@/lib/categories'
import CustomerPage from '@/components/customer/CustomerPage'
import BottomNav, { NAV_CLEARANCE } from '@/components/customer/BottomNav'
import SearchField from '@/components/customer/SearchField'
import CategoryChips from '@/components/customer/CategoryChips'
import OfferCard, { type CardOffer } from '@/components/customer/OfferCard'
import { EmptyState, NoOffersState } from '@/components/customer/States'
import { SearchIcon } from '@/components/customer/icons'

// The Offers tab (artboard Offers.dc.html). Order is exactly what
// nearby_active_offers() returned: the first visible offer is shown as the
// large "featured" card, the rest as rows — presentation only, never a
// reorder. Search and category filtering stay client-side over that list.
// Offer title/business name are shop-typed and never translated.
export default function NearbyOffersView({
  offers,
  token,
  initialCategory = null,
}: {
  offers: CardOffer[]
  token?: string
  initialCategory?: string | null
}) {
  const [locale] = useLocale()
  const copy = CUSTOMER_UI_COPY[locale]
  const listCopy = NEARBY_OFFERS_COPY[locale]
  const dir = getDir(locale)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory)

  // Chips only for categories actually present, in canonical order — plus
  // one pre-selected from Home even if it has nothing nearby, so the
  // customer can see why the list is empty and switch back to "All".
  const presentCategories = useMemo(() => {
    const present = new Set(offers.map((o) => o.category))
    if (initialCategory) present.add(initialCategory)
    return CATEGORIES.filter((c) => present.has(c))
  }, [offers, initialCategory])

  const query = search.trim().toLowerCase()
  const visibleOffers = useMemo(() => {
    return offers.filter((o) => {
      if (selectedCategory && o.category !== selectedCategory) return false
      if (!query) return true
      const categoryLabel = CATEGORY_LABELS[locale][o.category] ?? o.category
      return (
        o.title.toLowerCase().includes(query) ||
        o.businessName.toLowerCase().includes(query) ||
        categoryLabel.toLowerCase().includes(query)
      )
    })
  }, [offers, query, selectedCategory, locale])

  const [featured, ...rest] = visibleOffers

  return (
    <CustomerPage dir={dir} lang={locale} clearance={token ? NAV_CLEARANCE : 'pb-10'}>
      <div className="flex flex-col gap-3.5 px-6 pt-6">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-[28px] leading-[1.25] font-bold text-brand-navy-deep">{copy.offers.title}</h1>
          {offers.length > 0 && <p className="text-[15px] text-brand-muted">{copy.offers.available(offers.length)}</p>}
        </div>

        {offers.length === 0 ? (
          <NoOffersState locale={locale} />
        ) : (
          <>
            <SearchField
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              label={copy.home.searchLabel}
              placeholder={copy.offers.searchPlaceholder}
            />
            {presentCategories.length > 1 && (
              <CategoryChips
                categories={presentCategories}
                selected={selectedCategory}
                onSelect={setSelectedCategory}
                allLabel={listCopy.allCategories}
                locale={locale}
              />
            )}

            {visibleOffers.length === 0 ? (
              <EmptyState icon={<SearchIcon size={28} />} title={copy.offers.noMatch} />
            ) : (
              <div className="flex flex-col gap-3">
                <OfferCard offer={featured} variant="featured" locale={locale} />
                {rest.map((o) => (
                  <OfferCard key={o.id} offer={o} variant="row" locale={locale} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {token && <BottomNav token={token} active="offers" />}
    </CustomerPage>
  )
}
