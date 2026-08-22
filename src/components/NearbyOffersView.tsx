'use client'

import { useMemo, useState } from 'react'
import { useLocale } from '@/lib/i18n/useLocale'
import { getDir } from '@/lib/i18n/locale'
import { NEARBY_OFFERS_COPY } from '@/lib/i18n/offers'
import { CATEGORIES, CATEGORY_EMOJI, CATEGORY_LABELS } from '@/lib/categories'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import SiteLogo from '@/components/SiteLogo'
import type { NearbyOffer } from '@/lib/wallet/google-membership-pass'

const ARCHIVO = 'font-[family-name:var(--font-archivo)]'

function BackChevron({ rtl }: { rtl: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      // Path below is a left-pointing chevron ("‹") — correct for LTR
      // "back" as drawn. Mirrored only in RTL, where "back" points right
      // instead — same explicit-flip convention already used for the arrow
      // glyph in BrowseCategoryView.tsx.
      className={rtl ? 'scale-x-[-1]' : ''}
    >
      <path d="M10 3.5L5.5 8L10 12.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Split from the server page.tsx (src/app/offers/nearby/page.tsx) for the
// same reason as OfferPageView.tsx — useLocale()/LanguageSwitcher are
// client-only. offer_title/business_name are never run through the locale
// copy — shop-typed content, same reasoning as everywhere else in this app.
export default function NearbyOffersView({ otherOffers }: { otherOffers: NearbyOffer[] }) {
  const [locale, setLocale] = useLocale()
  const copy = NEARBY_OFFERS_COPY[locale]
  const dir = getDir(locale)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Boxes only for categories that actually have an offer in the list right
  // now — an empty, unselectable "Auto" box nobody can do anything with is
  // worse than not showing it. CATEGORIES (not just whatever's present, in
  // arbitrary order) is the iteration source so box order stays stable and
  // matches the canonical category order used everywhere else (e.g. /browse).
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const o of otherOffers) counts.set(o.business_category, (counts.get(o.business_category) ?? 0) + 1)
    return CATEGORIES.filter((c) => counts.has(c)).map((c) => ({ category: c, count: counts.get(c)! }))
  }, [otherOffers])

  // A search query always searches EVERYTHING regardless of the currently
  // selected category — typing "coffee" while browsing inside "Salon"
  // should still find the cafe offer, not silently return nothing. Category
  // selection only matters when there's no active search: it's the entry
  // point for browsing, search is the escape hatch for finding something
  // specific.
  const query = search.trim().toLowerCase()
  const searchResults = useMemo(() => {
    if (!query) return null
    return otherOffers.filter((o) => {
      const categoryLabel = CATEGORY_LABELS[locale][o.business_category] ?? o.business_category
      return (
        o.offer_title.toLowerCase().includes(query) ||
        o.business_name.toLowerCase().includes(query) ||
        categoryLabel.toLowerCase().includes(query)
      )
    })
  }, [otherOffers, query, locale])

  const categoryOffers = useMemo(
    () => (selectedCategory ? otherOffers.filter((o) => o.business_category === selectedCategory) : []),
    [otherOffers, selectedCategory],
  )

  // Three views: search results (query present, wins regardless of
  // selection), a single category's offers (selected, no query), or the
  // category grid (neither — the default landing view).
  const showingList = query ? true : selectedCategory != null
  const visibleOffers = query ? (searchResults ?? []) : categoryOffers

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
        <p className="mb-6 text-[15px] text-[#5a5a5a]">{copy.subheading}</p>

        {otherOffers.length > 0 && (
          <div className="relative mb-6">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
              className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-neutral-400 ${dir === 'rtl' ? 'right-3.5' : 'left-3.5'}`}
            >
              <circle cx="7" cy="7" r="5.25" stroke="currentColor" strokeWidth="1.5" />
              <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={copy.searchPlaceholder}
              className={`w-full rounded-xl border border-neutral-200 bg-white py-3 text-[15px] text-[#1a1a1a] placeholder:text-neutral-400 focus:border-[#FF6B4A]/50 focus:outline-none ${dir === 'rtl' ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
            />
          </div>
        )}

        {otherOffers.length === 0 ? (
          <p className="text-sm text-neutral-500">{copy.empty}</p>
        ) : !showingList ? (
          // Category grid — the default landing view. Each box: emoji,
          // translated label, offer count. Tapping one drills into that
          // category's list below.
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {categoryCounts.map(({ category, count }) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className="flex flex-col items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-5 text-center shadow-sm transition-colors active:border-[#FF6B4A]/50 active:bg-[#FFF7F3]"
              >
                <span className="text-3xl" aria-hidden="true">
                  {CATEGORY_EMOJI[category] ?? CATEGORY_EMOJI.other}
                </span>
                <span className="text-sm font-semibold text-[#1a1a1a]">{CATEGORY_LABELS[locale][category]}</span>
                <span className="text-xs text-neutral-400">{copy.offersCount(count)}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Only a real "back" when browsing a category — a search result
                list has nothing to go "back" to (clearing the search input
                itself is the way out, same as any search field). */}
            {selectedCategory && !query && (
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className="mb-1 flex items-center gap-1.5 self-start text-sm font-medium text-neutral-500 hover:text-[#1a1a1a]"
              >
                <BackChevron rtl={dir === 'rtl'} />
                {copy.backToCategories}
              </button>
            )}

            {visibleOffers.length === 0 ? (
              <p className="text-sm text-neutral-500">{copy.emptySearch}</p>
            ) : (
              visibleOffers.map((o) => (
                // Each row is a real link to /offers/[campaignId] — the same
                // page top-ranked offers use, Directions/WhatsApp/Call
                // included. The chevron + explicit label + an active:
                // (press) state are what actually signal "tap me" on a
                // touchscreen, which is how this page is normally opened
                // (from the Wallet card's "Other offers nearby" link).
                <a
                  key={o.offer_id}
                  href={`/offers/${o.offer_id}`}
                  className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-colors active:border-[#FF6B4A]/50 active:bg-[#FFF7F3]"
                >
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#FFF7F3] text-xl"
                    aria-hidden="true"
                  >
                    {CATEGORY_EMOJI[o.business_category] ?? CATEGORY_EMOJI.other}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="mb-1 text-xs text-neutral-400">{o.business_name}</p>
                    <h2 className="mb-1 font-medium text-[#1a1a1a]">{o.offer_title}</h2>
                    <p className="text-sm text-neutral-500">{copy.kmAway(o.distance_km.toFixed(1))}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5 text-[#FF6B4A]">
                    <span className="text-sm font-semibold whitespace-nowrap">{copy.viewOffer}</span>
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
              ))
            )}
          </div>
        )}
      </div>
    </main>
  )
}
