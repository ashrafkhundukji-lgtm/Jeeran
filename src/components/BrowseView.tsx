'use client'

import { useMemo, useState } from 'react'
import { useLocale } from '@/lib/i18n/useLocale'
import { getDir } from '@/lib/i18n/locale'
import { displayFont } from '@/lib/i18n/displayFont'
import { BROWSE_COPY } from '@/lib/i18n/browse'
import { CATEGORIES, CATEGORY_EMOJI, CATEGORY_LABELS } from '@/lib/categories'
import SiteLogo from '@/components/SiteLogo'
import LevelBadge from '@/components/LevelBadge'
import type { RankedBusiness } from '@/lib/promotion'

// Single chip-filterable list across every category — replaces the old
// category-grid (/browse) -> per-category rank list (/browse/[category])
// two-step flow, matching the shape NearbyShopsView (/wallet/shops)
// established: search + horizontal category chips + one flat list, each row
// linking to a live offer when the shop has one, directions otherwise. The
// only real difference from the wallet version: no visitor location here,
// so rows show a promotion-tier badge instead of a distance.
export default function BrowseView({ shops }: { shops: RankedBusiness[] }) {
  const [locale] = useLocale()
  const copy = BROWSE_COPY[locale]
  const dir = getDir(locale)
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
    <main dir={dir} className="min-h-screen bg-[#FBFCFD] px-6 py-8 text-[#1a1a1a] sm:px-8">
      <div className="mx-auto max-w-[720px]">
        <div className="mb-5 flex justify-center">
          <SiteLogo className="h-14 sm:h-16" />
        </div>
        <h1 className={`${displayFont(locale)} mb-2 text-[28px] font-black leading-[1.05] tracking-[-0.01em] sm:text-[34px]`}>
          {copy.title}
        </h1>
        <p className="mb-6 text-[15px] text-[#5a5a5a]">{copy.subtitle}</p>

        {shops.length > 0 && (
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

        {shops.length === 0 ? (
          <p className="text-sm text-[#8a8a8a]">{copy.empty}</p>
        ) : visibleShops.length === 0 ? (
          <p className="text-sm text-[#8a8a8a]">{copy.emptySearch}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {visibleShops.map((s) => {
              const href = s.hasActiveOffer
                ? `/offers/${s.topOfferId}`
                : s.businessLat != null && s.businessLng != null
                  ? `https://www.google.com/maps/dir/?api=1&destination=${s.businessLat},${s.businessLng}`
                  : null

              const Row = (
                <>
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-[#FFF7F3] text-xl"
                    aria-hidden="true"
                  >
                    {CATEGORY_EMOJI[s.category] ?? CATEGORY_EMOJI.other}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="mb-1 font-medium text-[#1a1a1a]">{s.businessName}</h2>
                    <LevelBadge level={s.level} locale={locale} />
                    {s.hasActiveOffer && (
                      <span className="ms-2 inline-block rounded-full bg-[#FF6B4A]/10 px-2 py-0.5 text-xs font-medium text-[#FF6B4A]">
                        {copy.hasOffer}
                      </span>
                    )}
                  </div>
                  {href && (
                    <div className="flex shrink-0 items-center gap-1.5 text-[#FF6B4A]">
                      <span className="text-sm font-semibold whitespace-nowrap">
                        {s.hasActiveOffer ? copy.viewOffer : copy.getDirections}
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
                  )}
                </>
              )

              const rowClass =
                'flex items-center gap-3 rounded-[18px] border border-[#ececec] bg-white p-4 shadow-sm transition-colors'

              return href ? (
                <a key={s.businessId} href={href} className={`${rowClass} active:border-[#FF6B4A]/50 active:bg-[#FFF7F3]`}>
                  {Row}
                </a>
              ) : (
                <div key={s.businessId} className={rowClass}>
                  {Row}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
