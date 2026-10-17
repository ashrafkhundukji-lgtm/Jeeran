'use client'

import OwnerShell, { OwnerTopBar } from '@/components/owner/OwnerShell'
import NewCustomerLeaderboard from '@/components/NewCustomerLeaderboard'
import { useLocale } from '@/lib/i18n/useLocale'
import { DASHBOARD_COPY } from '@/lib/i18n/dashboard'

// Drill-in page for the "most active shops" leaderboard — motivational, not
// operational, so it lives off the home screen. Highlights the Home tab
// (it's reached from there).
export default function OwnerLeaderboardView({ businessId }: { businessId: string }) {
  const [locale] = useLocale()
  const copy = DASHBOARD_COPY[locale]

  return (
    <OwnerShell
      tab="home"
      header={<OwnerTopBar variant="subpage" title={copy.leaderboard.heading} backHref="/dashboard/owner" backLabel={copy.common.back} />}
    >
      <NewCustomerLeaderboard businessId={businessId} />
    </OwnerShell>
  )
}
