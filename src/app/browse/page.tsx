import SiteLogo from '@/components/SiteLogo'
import { CATEGORIES } from '@/lib/categories'

export default function BrowseCategoriesPage() {
  return (
    <main className="min-h-screen bg-[#FBFCFD] px-4 py-10">
      <div className="max-w-sm mx-auto w-full">
        <div className="flex justify-center mb-8">
          <SiteLogo className="h-20" />
        </div>

        <h1 className="text-xl font-semibold text-center mb-1">Browse shops</h1>
        <p className="text-sm text-neutral-500 text-center mb-8">Pick a category to see shops near you.</p>

        <div className="flex flex-col gap-2">
          {CATEGORIES.map((category) => (
            <a
              key={category}
              href={`/browse/${category}`}
              className="border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium capitalize hover:border-neutral-300 hover:bg-neutral-50 transition-colors"
            >
              {category}
            </a>
          ))}
        </div>
      </div>
    </main>
  )
}
