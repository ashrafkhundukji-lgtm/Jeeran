'use client'

import SiteLogo from '@/components/SiteLogo'
import Backdrop from '@/components/Backdrop'
import { CATEGORIES, CATEGORY_LABELS } from '@/lib/categories'
import { BROWSE_COPY } from '@/lib/i18n/browse'
import { getDir } from '@/lib/i18n/locale'
import { useLocale } from '@/lib/i18n/useLocale'

export default function BrowseCategoriesPage() {
  const [locale] = useLocale()
  const dir = getDir(locale)
  const copy = BROWSE_COPY[locale]
  const labels = CATEGORY_LABELS[locale]

  return (
    <main dir={dir} className="relative min-h-screen overflow-hidden bg-[#FBFCFD] px-4 py-10 text-[#1a1a1a]">
      <Backdrop />

      <div className="relative z-10 mx-auto w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <SiteLogo className="h-14 sm:h-16" />
        </div>

        <h1 className="mb-1 text-center font-[family-name:var(--font-archivo)] text-2xl font-black tracking-[-0.01em]">
          {copy.title}
        </h1>
        <p className="mb-8 text-center text-sm text-[#5a5a5a]">{copy.subtitle}</p>

        <div className="flex flex-col gap-2">
          {CATEGORIES.map((category) => (
            <a
              key={category}
              href={`/browse/${category}`}
              className="rounded-xl border border-[#e5e5e5] px-4 py-3 text-sm font-medium transition-colors hover:border-[#1E3A8A]/30 hover:bg-[#1E3A8A]/[0.03]"
            >
              {labels[category]}
            </a>
          ))}
        </div>
      </div>
    </main>
  )
}
