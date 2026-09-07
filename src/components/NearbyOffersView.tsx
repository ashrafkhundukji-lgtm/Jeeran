'use client'

import { useMemo, useState } from 'react'
import { useLocale } from '@/lib/i18n/useLocale'
import { getDir } from '@/lib/i18n/locale'
import { displayFont } from '@/lib/i18n/displayFont'
import { NEARBY_OFFERS_COPY } from '@/lib/i18n/offers'
import { CATEGORIES, CATEGORY_EMOJI, CATEGORY_LABELS } from '@/lib/categories'
import WalletTabBar from '@/components/WalletTabBar'
import WalletAppBar from '@/components/WalletAppBar'
import type { NearbyOffer } from '@/lib/wallet/google-membership-pass'

// Split from the server page.tsx (src/app/offers/nearby/page.tsx) for the
// same reason as OfferPageView.tsx — useLocale() is client-only.
// offer_title/business_name are never run through the locale copy —
// shop-typed content, same reasoning as everywhere else in this app.
//
// Chip row + always-visible flat list (was a category-grid-then-drill-down
// two-step flow) — the mobile-app redesign traded that drill-down for a
// single scrollable list filterable by a horizontal chip row, matching how
// most native shopping/delivery apps do category filtering. "All" is
// selected by default so the full list shows immediately.
export default function NearbyOffersView({ offers, token }: { offers: NearbyOffer[]; token?: string }) {
  const [locale] = useLocale()
  const copy = NEARBY_OFFERS_COPY[locale]
  const dir = getDir(locale)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null) // null = "All"

  // Chips only for categories actually present — an empty, unselectable
  // "Auto" chip nobody can do anything with is worse than not showing it.
  // CATEGORIES (not just whatever's present, in arbitrary order) is the
  // iteration source so chip order stays stable and matches the canonical
  // category order used everywhere else (e.g. /browse).
  const presentCategories = useMemo(() => {
    const present = new Set(offers.map((o) => o.business_category))
    return CATEGORIES.filter((c) => present.has(c))
  }, [offers])

  const query = search.trim().toLowerCase()
  const visibleOffers = useMemo(() => {
    return offers.filter((o) => {
      if (selectedCategory && o.business_category !== selectedCategory) return false
      if (!query) return true
      const categoryLabel = CATEGORY_LABELS[locale][o.business_category] ?? o.business_category
      return (
        o.offer_title.toLowerCase().includes(query) ||
        o.business_name.toLowerCase().includes(query) ||
        categoryLabel.toLowerCase().includes(query)
      )
    })
  }, [offers, query, selectedCategory, locale])

  return (
    <main dir={dir} className="min-h-screen bg-[#FBFCFD] pb-24 text-[#1a1a1a]">
      {token && <WalletAppBar token={token} />}
      <div className="mx-auto max-w-[720px] px-6 pt-6 sm:px-8">
        <h1 className={`${displayFont(locale)} mb-2 text-[28px] font-black leading-[1.05] tracking-[-0.01em] sm:text-[34px]`}>
          {copy.heading}
        </h1>
        <p className="mb-6 text-[15px] text-[#5a5a5a]">{copy.subheading}</p>

        {offers.length > 0 && (
          <>
            <div className="relative mb-4">
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
                className={`w-full rounded-xl border border-[#ececec] bg-white py-3 text-[15px] text-[#1a1a1a] placeholder:text-neutral-400 focus:border-[#FF6B4A]/50 focus:outline-none ${dir === 'rtl' ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
              />
            </div>

            <div
              className="mb-5 flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: 'none' }}
            >
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${
                  selectedCategory === null ? 'bg-[#1E3A8A] text-white' : 'border border-[#ececec] bg-white text-[#1a1a1a]'
                }`}
              >
                {copy.allCategories}
              </button>
              {presentCategories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedCategory(c)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
                    selectedCategory === c ? 'bg-[#1E3A8A] text-white' : 'border border-[#ececec] bg-white text-[#1a1a1a]'
                  }`}
                >
                  <span aria-hidden="true">{CATEGORY_EMOJI[c] ?? CATEGORY_EMOJI.other}</span>
                  {CATEGORY_LABELS[locale][c]}
                </button>
              ))}
            </div>
          </>
        )}

        {offers.length === 0 ? (
          <p className="text-sm text-[#8a8a8a]">{copy.empty}</p>
        ) : visibleOffers.length === 0 ? (
          <p className="text-sm text-[#8a8a8a]">{copy.emptySearch}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {visibleOffers.map((o) => (
              // Each row is a real link to /offers/[campaignId] — the same
              // page top-ranked offers use, Directions/WhatsApp/Call
              // included. The chevron + explicit label + an active: (press)
              // state are what actually signal "tap me" on a touchscreen.
              <a
                key={o.offer_id}
                href={token ? `/offers/${o.offer_id}?token=${encodeURIComponent(token)}` : `/offers/${o.offer_id}`}
                className="flex items-center gap-3 rounded-[18px] border border-[#ececec] bg-white p-4 shadow-sm transition-colors active:border-[#FF6B4A]/50 active:bg-[#FFF7F3]"
              >
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-[#FFF7F3] text-xl"
                  aria-hidden="true"
                >
                  {CATEGORY_EMOJI[o.business_category] ?? CATEGORY_EMOJI.other}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="mb-1 text-xs text-neutral-400">{o.business_name}</p>
                  <h2 className="mb-1 font-medium text-[#1a1a1a]">{o.offer_title}</h2>
                  <p className="text-sm text-[#8a8a8a]">{copy.kmAway(o.distance_km.toFixed(1))}</p>
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
            ))}
          </div>
        )}
      </div>

      {token && <WalletTabBar token={token} active="offers" />}
    </main>
  )
}
