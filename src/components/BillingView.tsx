'use client'

import DashboardNav from '@/components/DashboardNav'
import OwnerAppBar from '@/components/OwnerAppBar'
import BillingActions from '@/components/BillingActions'
import { useLocale } from '@/lib/i18n/useLocale'
import { getDir } from '@/lib/i18n/locale'
import { DASHBOARD_COPY, type DashboardCopy } from '@/lib/i18n/dashboard'
import type { CatalogEntry } from '@/lib/billing/catalog'
import type { ReachTier } from '@/lib/billing/account'

export interface LedgerEntry {
  id: string
  date: string
  amount: number
  isCredit: boolean
  kind: 'topup' | 'subscription_initial' | 'subscription_renewal' | 'usage'
  campaignTitle: string | null
  // Set only for add-on billing_transactions rows (see
  // billing_transactions.addon_key's migration comment) — distinguishes an
  // add-on subscription event from a base-subscription one despite sharing
  // the same `kind` values, so the ledger doesn't mislabel an Instant Notify
  // renewal as "Subscription renewed".
  addonKey: string | null
}

// Ledger rows are grouped by day (design_handoff_jeeran_mobile/README.md §4)
// — replaces the old flat list showing a full `toLocaleString()` date+time on
// every row, unreadable at mobile width. Assumes `ledger` arrives newest-first
// (it does — see src/app/dashboard/billing/page.tsx's query order), so
// same-day rows are already contiguous and a single pass suffices.
function dayLabelFor(dateStr: string, copy: DashboardCopy['billing']): string {
  const d = new Date(dateStr)
  const now = new Date()
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diffDays = Math.round((startOfDay(now) - startOfDay(d)) / 86400000)
  if (diffDays === 0) return copy.todayLabel
  if (diffDays === 1) return copy.yesterdayLabel
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

function groupLedgerByDay(ledger: LedgerEntry[], copy: DashboardCopy['billing']) {
  const groups: { label: string; rows: LedgerEntry[] }[] = []
  for (const row of ledger) {
    const label = dayLabelFor(row.date, copy)
    const last = groups[groups.length - 1]
    if (last && last.label === label) last.rows.push(row)
    else groups.push({ label, rows: [row] })
  }
  return groups
}

function labelFor(entry: LedgerEntry, copy: DashboardCopy['billing']) {
  if (entry.addonKey) {
    switch (entry.kind) {
      case 'subscription_initial':
        return copy.addonStarted
      case 'subscription_renewal':
        return copy.addonRenewed
    }
  }
  switch (entry.kind) {
    case 'topup':
      return copy.topupTransaction
    case 'subscription_initial':
      return copy.subscriptionStarted
    case 'subscription_renewal':
      return copy.subscriptionRenewed
    case 'usage':
      return copy.adClaimed.replace('{title}', entry.campaignTitle ?? copy.campaignFallback)
  }
}

export default function BillingView({
  isSubscriptionActive,
  isInstantNotifyActive,
  reachTier,
  adCredits,
  catalog,
  ledger,
}: {
  // accountName was shown as a subtitle under the page heading before the
  // mobile redesign — OwnerAppBar's subpage variant has no subtitle slot, so
  // it's no longer displayed. Dropped from the props rather than kept unused.
  isSubscriptionActive: boolean
  isInstantNotifyActive: boolean
  reachTier: ReachTier
  adCredits: number
  catalog: CatalogEntry[]
  ledger: LedgerEntry[]
}) {
  const [locale] = useLocale()
  const dir = getDir(locale)
  const copy = DASHBOARD_COPY[locale].billing

  const subscriptionEntry = catalog.find((c) => c.type === 'subscription')
  const dayGroups = groupLedgerByDay(ledger, copy)

  return (
    <main dir={dir} className="min-h-screen bg-[#FBFCFD] pb-24 md:pb-10">
      <OwnerAppBar variant="subpage" dir={dir} title={copy.heading} backHref="/dashboard/owner" backLabel={DASHBOARD_COPY[locale].common.back} />

      <div className="px-[18px] pt-5">
        {/* Status hero */}
        <div
          className="mb-[22px] rounded-[22px] p-5 text-white"
          style={{ background: 'linear-gradient(135deg,#1E3A8A,#3B5BC4)' }}
        >
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="mb-[5px] text-[11.5px] font-semibold tracking-[0.07em] text-white/72">
                {copy.subscriptionStatus}
              </p>
              <div className="flex items-center gap-[7px]">
                <span className={`h-[7px] w-[7px] rounded-full ${isSubscriptionActive ? 'bg-[#4ade80]' : 'bg-[#f87171]'}`} />
                <span className="text-[15px] font-semibold">{isSubscriptionActive ? copy.active : copy.inactive}</span>
              </div>
            </div>
            <div className="text-end">
              <p className="mb-[5px] text-[11.5px] font-semibold tracking-[0.07em] text-white/72">{copy.credits}</p>
              <div className="text-[28px] font-black">{adCredits}</div>
            </div>
          </div>
          {subscriptionEntry && (
            <div className="border-t border-white/[0.18] pt-[13px] text-[12.5px] text-white/80">
              {`$${subscriptionEntry.amountUsd}/${copy.perMonthSuffix}`}
            </div>
          )}
        </div>

        <BillingActions
          catalog={catalog}
          isSubscriptionActive={isSubscriptionActive}
          isInstantNotifyActive={isInstantNotifyActive}
          reachTier={reachTier}
        />

        <section className="mt-[22px]">
          <h2 className="mb-3 text-[13px] font-semibold tracking-[0.06em] text-[#8a8a8a]">{copy.history}</h2>
          {ledger.length === 0 ? (
            <p className="text-[14px] text-[#a3a3a3]">{copy.noActivity}</p>
          ) : (
            dayGroups.map((group) => (
              <div key={group.label} className="mb-4">
                <div className="mb-2 text-[11.5px] font-semibold text-[#a3a3a3]">{group.label}</div>
                <div className="overflow-hidden rounded-[16px] border border-[#ececec] bg-white">
                  {group.rows.map((row) => (
                    <div
                      key={row.id}
                      className="flex items-center justify-between gap-3 border-b border-[#f4f4f4] px-[15px] py-[13px] last:border-b-0"
                    >
                      <div>
                        <div className="text-[13.5px] font-medium">{labelFor(row, copy)}</div>
                        <div className="mt-0.5 text-[11.5px] text-[#a3a3a3]">
                          {new Date(row.date).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                        </div>
                      </div>
                      <div className={`shrink-0 text-[14px] font-semibold ${row.amount >= 0 ? 'text-[#15803d]' : 'text-[#8a8a8a]'}`}>
                        {Math.abs(row.amount)}
                        {row.amount >= 0 ? '+' : '−'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </section>
      </div>

      <DashboardNav />
    </main>
  )
}
