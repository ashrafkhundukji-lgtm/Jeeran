'use client'

import SiteLogo from '@/components/SiteLogo'
import Backdrop from '@/components/Backdrop'
import LevelBadge from '@/components/LevelBadge'
import { CATEGORY_LABELS } from '@/lib/categories'
import { BROWSE_COPY } from '@/lib/i18n/browse'
import { getDir } from '@/lib/i18n/locale'
import { useLocale } from '@/lib/i18n/useLocale'
import type { RankedBusiness } from '@/lib/promotion'

// Locale is only known client-side (see useLocale), so the server page
// component (src/app/browse/[category]/page.tsx) does the data fetch and
// hands the result to this client component to render with the right copy
// and RTL/LTR direction — same split used elsewhere in the app (e.g.
// OwnerDashboardView) for server-fetched, client-localized pages.
export default function BrowseCategoryView({ category, shops }: { category: string; shops: RankedBusiness[] }) {
  const [locale] = useLocale()
  const dir = getDir(locale)
  const copy = BROWSE_COPY[locale]
  const categoryLabel = CATEGORY_LABELS[locale][category] ?? category

  return (
    <main dir={dir} className="relative min-h-screen overflow-hidden bg-[#FBFCFD] px-4 py-10 text-[#1a1a1a]">
      <Backdrop />

      <div className="relative z-10 mx-auto w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <SiteLogo className="h-14 sm:h-16" />
        </div>

        <a href="/browse" className="mb-4 inline-flex items-center gap-1.5 text-sm text-[#1E3A8A] underline">
          <span aria-hidden="true">{dir === 'rtl' ? '→' : '←'}</span>
          {copy.backToCategories}
        </a>
        <h1 className="mb-1 font-[family-name:var(--font-archivo)] text-2xl font-black tracking-[-0.01em]">
          {categoryLabel}
        </h1>
        <p className="mb-6 text-sm text-[#5a5a5a]">{copy.categorySubtitle}</p>

        {shops.length === 0 ? (
          <p className="py-12 text-center text-sm text-neutral-400">{copy.noShops}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {shops.map((shop, i) => (
              <div
                key={shop.businessId}
                className="flex items-center justify-between rounded-xl border border-[#e5e5e5] bg-white p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="w-4 text-xs font-medium text-neutral-400">{i + 1}</span>
                  <span className="text-sm font-medium">{shop.businessName}</span>
                </div>
                <LevelBadge level={shop.level} />
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
