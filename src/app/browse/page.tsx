import BrowseView from '@/components/BrowseView'
import { browseAllBusinesses } from '@/lib/promotion'

export const dynamic = 'force-dynamic'

export default async function BrowsePage() {
  const shops = await browseAllBusinesses()

  return <BrowseView shops={shops} />
}
