import { getAdminOverview } from '@/lib/admin'
import AdminSpreadMapLoader from '@/components/AdminSpreadMapLoader'
import { requireAdminPage } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

export default async function AdminSpreadPage() {
  await requireAdminPage('/admin/spread')
  const { shops } = await getAdminOverview()

  return <AdminSpreadMapLoader shops={shops} />
}
