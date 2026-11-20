import { requireOwnerBusiness } from '@/lib/ownerContext'
import NotificationSettingsView from '@/components/owner/NotificationSettingsView'

export const dynamic = 'force-dynamic'

// Owner app notification settings. Same auth gate as the other owner pages
// (session, onboarding and frozen redirects); the data itself is loaded by
// the client from /api/owner/push/preferences.
export default async function NotificationsPage() {
  await requireOwnerBusiness('id, is_frozen')
  return <NotificationSettingsView />
}
