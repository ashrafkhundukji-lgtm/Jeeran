'use client'

import { useMemo, useState } from 'react'
import { useLocale } from '@/lib/i18n/useLocale'
import { BROWSE_COPY } from '@/lib/i18n/browse'
import { CUSTOMER_UI_COPY } from '@/lib/i18n/customerUi'
import { CATEGORIES, CATEGORY_LABELS } from '@/lib/categories'
import { BrowseShell } from '@/components/BrowseRouteStates'
import SearchField from '@/components/customer/SearchField'
import CategoryChips from '@/components/customer/CategoryChips'
import ShopRow from '@/components/customer/ShopRow'
import { EmptyState } from '@/components/customer/States'
import { ChevronForwardIcon, NavigationIcon, SearchIcon, StoreIcon } from '@/components/customer/icons'
import type { RankedBusiness } from '@/lib/promotion'

// Public shop directory (/browse). Same building blocks as the customer
// pages (/wallet/shops): SearchField, CategoryChips, ShopRow + ShopAvatar,
// EmptyState — inside the public-site shell (SiteHeader/SiteFooter).
//
// Data and behaviour are unchanged: the list is browse_all_businesses() in
// its own order; search matches the shop name or category label; chips
// filter by category; a row opens the shop's live offer, or Google Maps
// directions when it has none. No logos yet — the browse query doesn't
// return logo_url, so ShopAvatar shows the letter avatar.
export default function BrowseView({ shops }: { shops: RankedBusiness[] }) {
  const [locale] = useLocale()
  const copy = BROWSE_COPY[locale]
  const ui = CUSTOMER_UI_COPY[locale]
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null) // null = "All"

  const presentCategories = useMemo(() => {
    const present = new Set(shops.map((s) => s.category))
    return CATEGORIES.filter((c) => present.has(c))
  }, [shops])

  const query = search.trim().toLowerCase()
  const visibleShops = useMemo(() => {
    return shops.filter((s) => {
      if (selectedCategory && s.category !== selectedCategory) return false
      if (!query) return true
      const categoryLabel = CATEGORY_LABELS[locale][s.category] ?? s.category
      return s.businessName.toLowerCase().includes(query) || categoryLabel.toLowerCase().includes(query)
    })
  }, [shops, query, selectedCategory, locale])

  return (
    <BrowseShell>
      {shops.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={<StoreIcon size={28} />} title={copy.empty} />
        </div>
      ) : (
        <>
          <div className="mt-5 flex flex-col gap-3.5">
            <SearchField
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              label={ui.home.searchLabel}
              placeholder={copy.searchPlaceholder}
              className="w-full md:max-w-[560px]"
            />
            <p aria-live="polite" className="text-[13px] font-semibold text-brand-muted">
              {copy.resultCount(visibleShops.length)}
            </p>
            {presentCategories.length > 1 && (
              <CategoryChips
                categories={presentCategories}
                selected={selectedCategory}
                onSelect={setSelectedCategory}
                allLabel={copy.allCategories}
                locale={locale}
              />
            )}
          </div>

          {visibleShops.length === 0 ? (
            <div className="mt-5">
              <EmptyState icon={<SearchIcon size={28} />} title={copy.emptySearch} />
            </div>
          ) : (
            <ul className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
              {visibleShops.map((s) => {
                const href = s.hasActiveOffer
                  ? `/offers/${s.topOfferId}`
                  : s.businessLat != null && s.businessLng != null
                    ? `https://www.google.com/maps/dir/?api=1&destination=${s.businessLat},${s.businessLng}`
                    : null
                const categoryLabel = CATEGORY_LABELS[locale][s.category] ?? s.category
                const detail = s.hasActiveOffer ? (
                  <span className="inline-flex w-fit items-center rounded-full bg-brand-coral-tint px-2.5 py-0.5 text-xs font-semibold text-[#9E2B10]">
                    {copy.hasOffer}
                  </span>
                ) : undefined
                // Offer → "View offer" + chevron. No offer → a quiet
                // directions cue (the row opens Maps, as before).
                const trailing = s.hasActiveOffer ? (
                  <span className="flex flex-none items-center gap-1 text-sm font-semibold whitespace-nowrap text-brand-coral">
                    {copy.viewOffer}
                    <ChevronForwardIcon size={18} strokeWidth={2.2} />
                  </span>
                ) : (
                  <span className="flex flex-none items-center text-brand-muted">
                    <NavigationIcon size={20} strokeWidth={1.8} />
                    <span className="sr-only">{copy.getDirections}</span>
                  </span>
                )

                return (
                  <li key={s.businessId}>
                    <ShopRow href={href} name={s.businessName} meta={categoryLabel} detail={detail} trailing={trailing} />
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}
    </BrowseShell>
  )
}
