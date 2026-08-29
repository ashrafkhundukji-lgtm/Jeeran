'use client'

import { useMemo, useState } from 'react'
import { useLocale } from '@/lib/i18n/useLocale'
import { getDir } from '@/lib/i18n/locale'
import { NEARBY_SHOPS_COPY } from '@/lib/i18n/nearbyShops'
import { CATEGORIES, CATEGORY_EMOJI, CATEGORY_LABELS } from '@/lib/categories'
import WalletTabBar from '@/components/WalletTabBar'
import type { NearbyBusiness } from '@/lib/wallet/nearby-businesses'

const ARCHIVO = 'font-[family-name:var(--font-archivo)]'

// Chip row + always-visible flat list, same shape as NearbyOffersView.tsx
// (src/app/offers/nearby) — see that file's header comment for why this
// replaced the earlier category-grid-then-drill-down flow. Covers EVERY
// nearby shop instead of only ones with an active offer — see
// nearby_businesses() (supabase/migrations/20260829b_nearby_businesses.sql).
// Each row routes to /offers/[campaignId] when the shop has one live, same
// destination the Wallet card's own "View offer" links use; otherwise it's
// a plain Directions link — still a useful tap, just not an offer page
// that doesn't exist for that shop.
export default function NearbyShopsView({ shops, token }: { shops: NearbyBusiness[]; token?: string }) {
  const [locale] = useLocale()
  const copy = NEARBY_SHOPS_COPY[locale]
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
      return s.business_name.toLowerCase().includes(query) || categoryLabel.toLowerCase().includes(query)
    })
  }, [shops, query, selectedCategory, locale])

  return (
    <main dir={dir} className="min-h-screen bg-[#FBFCFD] pb-24 text-[#1a1a1a]">
      <div className="mx-auto max-w-[720px] px-6 pt-10 sm:px-8">
        <h1 className={`${ARCHIVO} mb-2 text-[28px] font-black leading-[1.05] tracking-[-0.01em] sm:text-[34px]`}>
          {copy.heading}
        </h1>
        <p className="mb-6 text-[15px] text-[#5a5a5a]">{copy.subheading}</p>

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
                className={`w-full rounded-xl border border-neutral-200 bg-white py-3 text-[15px] text-[#1a1a1a] placeholder:text-neutral-400 focus:border-[#FF6B4A]/50 focus:outline-none ${dir === 'rtl' ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
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
                  selectedCategory === null ? 'bg-[#1E3A8A] text-white' : 'border border-neutral-200 bg-white text-[#1a1a1a]'
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
                    selectedCategory === c ? 'bg-[#1E3A8A] text-white' : 'border border-neutral-200 bg-white text-[#1a1a1a]'
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
          <p className="text-sm text-neutral-500">{copy.empty}</p>
        ) : visibleShops.length === 0 ? (
          <p className="text-sm text-neutral-500">{copy.emptySearch}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {visibleShops.map((s) => {
              const href = s.has_active_offer
                ? token
                  ? `/offers/${s.top_offer_id}?token=${encodeURIComponent(token)}`
                  : `/offers/${s.top_offer_id}`
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
            })}
          </div>
        )}
      </div>

      {token && <WalletTabBar token={token} active="shops" />}
    </main>
  )
}
