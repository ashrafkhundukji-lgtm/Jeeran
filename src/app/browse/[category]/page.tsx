import { notFound } from 'next/navigation'
import BrowseCategoryView from '@/components/BrowseCategoryView'
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

  return <BrowseCategoryView category={category} shops={shops} />
}
