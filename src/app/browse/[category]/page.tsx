import { notFound } from 'next/navigation'
import SiteLogo from '@/components/SiteLogo'
import Backdrop from '@/components/Backdrop'
import LevelBadge from '@/components/LevelBadge'
import { CATEGORIES } from '@/lib/categories'
import { browseBusinessesByCategory } from '@/lib/promotion'

export const dynamic = 'force-dynamic'

export default async function BrowseCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>
}) {
  const { category } = await params
  if (!CATEGORIES.includes(category)) notFound()

  const shops = await browseBusinessesByCategory(category)

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#FBFCFD] px-4 py-10 text-[#1a1a1a]">
      <Backdrop />

      <div className="relative z-10 mx-auto w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <SiteLogo className="h-14 sm:h-16" />
        </div>

        <a href="/browse" className="mb-4 inline-block text-sm text-[#1E3A8A] underline">
          &larr; All categories
        </a>
        <h1 className="mb-1 font-[family-name:var(--font-archivo)] text-2xl font-black tracking-[-0.01em] capitalize">
          {category}
        </h1>
        <p className="mb-6 text-sm text-[#5a5a5a]">Top-promoted shops appear first.</p>

        {shops.length === 0 ? (
          <p className="py-12 text-center text-sm text-neutral-400">No shops in this category yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {shops.map((shop, i) => (
              <div
                key={shop.businessId}
                className="flex items-center justify-between rounded-xl border border-[#e5e5e5] p-4"
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
