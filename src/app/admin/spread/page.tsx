import { getAdminOverview } from '@/lib/admin'
import AdminSpreadMapLoader from '@/components/AdminSpreadMapLoader'

export const dynamic = 'force-dynamic'

export default async function AdminSpreadPage() {
  const { shops } = await getAdminOverview()

  return <AdminSpreadMapLoader shops={shops} />
}
