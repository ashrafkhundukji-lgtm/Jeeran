import { notFound } from 'next/navigation'
import SiteLogo from '@/components/SiteLogo'
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
    <main className="min-h-screen bg-[#FBFCFD] px-4 py-10">
      <div className="max-w-sm mx-auto w-full">
        <div className="flex justify-center mb-8">
          <SiteLogo className="h-20" />
        </div>

        <a href="/browse" className="text-sm text-neutral-500 underline mb-4 inline-block">
          &larr; All categories
        </a>
        <h1 className="text-xl font-semibold capitalize mb-1">{category}</h1>
        <p className="text-sm text-neutral-500 mb-6">Top-promoted shops appear first.</p>

        {shops.length === 0 ? (
          <p className="text-sm text-neutral-400 text-center py-12">No shops in this category yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {shops.map((shop, i) => (
              <div
                key={shop.businessId}
                className="border border-neutral-200 rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-neutral-400 w-4">{i + 1}</span>
                  <span className="font-medium text-sm">{shop.businessName}</span>
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
