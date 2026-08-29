'use client'

import { useMemo, useState } from 'react'
import { useLocale } from '@/lib/i18n/useLocale'
import { getDir } from '@/lib/i18n/locale'
import { NEARBY_SHOPS_COPY } from '@/lib/i18n/nearbyShops'
import { CATEGORIES, CATEGORY_EMOJI, CATEGORY_LABELS } from '@/lib/categories'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import SiteLogo from '@/components/SiteLogo'
import BackButton from '@/components/BackButton'
import type { NearbyBusiness } from '@/lib/wallet/nearby-businesses'

const ARCHIVO = 'font-[family-name:var(--font-archivo)]'

function BackChevron({ rtl }: { rtl: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={rtl ? 'scale-x-[-1]' : ''}
    >
      <path d="M10 3.5L5.5 8L10 12.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Same category-grid-then-drill-down shape as NearbyOffersView.tsx
// (src/app/offers/nearby), just over EVERY nearby shop instead of only ones
// with an active offer — see nearby_businesses() (supabase/migrations/
// 20260829b_nearby_businesses.sql). Each row routes to /offers/[campaignId]
// when the shop has one live, same destination the Wallet card's own "View
// offer" links use; otherwise it's a plain Directions link — still a useful
// tap, just not an offer page that doesn't exist for that shop.
export default function NearbyShopsView({ shops }: { shops: NearbyBusiness[] }) {
  const [locale, setLocale] = useLocale()
  const copy = NEARBY_SHOPS_COPY[locale]
  const dir = getDir(locale)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const s of shops) counts.set(s.category, (counts.get(s.category) ?? 0) + 1)
    return CATEGORIES.filter((c) => counts.has(c)).map((c) => ({ category: c, count: counts.get(c)! }))
  }, [shops])

  const query = search.trim().toLowerCase()
  const searchResults = useMemo(() => {
    if (!query) return null
    return shops.filter((s) => {
      const categoryLabel = CATEGORY_LABELS[locale][s.category] ?? s.category
      return s.business_name.toLowerCase().includes(query) || categoryLabel.toLowerCase().includes(query)
    })
  }, [shops, query, locale])

  const categoryShops = useMemo(
    () => (selectedCategory ? shops.filter((s) => s.category === selectedCategory) : []),
    [shops, selectedCategory],
  )

  const showingList = query ? true : selectedCategory != null
  const visibleShops = query ? (searchResults ?? []) : categoryShops

  return (
    <main dir={dir} className="min-h-screen bg-[#FBFCFD] text-[#1a1a1a]">
      <header className="mx-auto flex max-w-[720px] items-center justify-between px-6 pt-8 sm:px-8">
        <div className="flex items-center gap-3">
          <BackButton dir={dir} label={copy.back} />
          <SiteLogo className="h-12" />
        </div>
        <LanguageSwitcher locale={locale} onChange={setLocale} />
      </header>

      <div className="mx-auto max-w-[720px] px-6 pt-10 pb-20 sm:px-8">
        <h1 className={`${ARCHIVO} mb-2 text-[28px] font-black leading-[1.05] tracking-[-0.01em] sm:text-[34px]`}>
          {copy.heading}
        </h1>
        <p className="mb-6 text-[15px] text-[#5a5a5a]">{copy.subheading}</p>

        {shops.length > 0 && (
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

        {shops.length === 0 ? (
          <p className="text-sm text-neutral-500">{copy.empty}</p>
        ) : !showingList ? (
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
                <span className="text-xs text-neutral-400">{copy.shopsCount(count)}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
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

            {visibleShops.length === 0 ? (
              <p className="text-sm text-neutral-500">{copy.emptySearch}</p>
            ) : (
              visibleShops.map((s) => {
                // Same fallback as offersToLinksModule's Directions-only
                // branch: send them straight to the offer if one exists,
                // otherwise a maps link is still a genuinely useful tap for
                // a shop with no active offer to view.
                const href = s.has_active_offer
                  ? `/offers/${s.top_offer_id}`
                  : `https://www.google.com/maps/dir/?api=1&destination=${s.business_lat},${s.business_lng}`

                return (
                  <a
                    key={s.business_id}
                    href={href}
                    className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-colors active:border-[#FF6B4A]/50 active:bg-[#FFF7F3]"
                  >
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#FFF7F3] text-xl"
                      aria-hidden="true"
                    >
                      {CATEGORY_EMOJI[s.category] ?? CATEGORY_EMOJI.other}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="mb-1 font-medium text-[#1a1a1a]">{s.business_name}</h2>
                      <p className="text-sm text-neutral-500">{copy.kmAway(s.distance_km.toFixed(1))}</p>
                      {s.has_active_offer && (
                        <span className="mt-1 inline-block rounded-full bg-[#FF6B4A]/10 px-2 py-0.5 text-xs font-medium text-[#FF6B4A]">
                          {copy.hasOffer}
                        </span>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5 text-[#FF6B4A]">
                      <span className="text-sm font-semibold whitespace-nowrap">
                        {s.has_active_offer ? copy.viewOffer : copy.getDirections}
                      </span>
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
                )
              })
            )}
          </div>
        )}
      </div>
    </main>
  )
}
