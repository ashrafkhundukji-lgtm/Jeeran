'use client'

import DashboardNav from '@/components/DashboardNav'
import OwnerAppBar from '@/components/OwnerAppBar'
import NewCustomerLeaderboard from '@/components/NewCustomerLeaderboard'
import { useLocale } from '@/lib/i18n/useLocale'
import { getDir } from '@/lib/i18n/locale'
import { DASHBOARD_COPY } from '@/lib/i18n/dashboard'

// Drill-in page for the leaderboard that used to be inlined on the owner
// dashboard home (design_handoff_jeeran_mobile/README.md §1, point 6) — it's
// motivational, not operational, and was outranking the owner's own numbers
// at the top of the page. NewCustomerLeaderboard itself is unchanged; this
// is just the subpage shell around it.
export default function OwnerLeaderboardView({ businessId }: { businessId: string }) {
  const [locale] = useLocale()
  const dir = getDir(locale)
  const copy = DASHBOARD_COPY[locale]

  return (
    <main dir={dir} className="min-h-screen bg-[#FBFCFD] pb-24 md:pb-10">
      <OwnerAppBar variant="subpage" dir={dir} title={copy.leaderboard.heading} backHref="/dashboard/owner" backLabel={copy.common.back} />
      <div className="px-5 pt-5">
        <NewCustomerLeaderboard businessId={businessId} />
      </div>
      <DashboardNav />
    </main>
  )
}
