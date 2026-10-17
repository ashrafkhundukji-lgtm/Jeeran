'use client'

import OwnerShell, { OwnerTopBar } from '@/components/owner/OwnerShell'
import BillingActions from '@/components/BillingActions'
import { Card } from '@/components/owner/ui'
import { EmptyState } from '@/components/customer/States'
import { ClockIcon } from '@/components/customer/icons'
import { useLocale } from '@/lib/i18n/useLocale'
import type { Locale } from '@/lib/i18n/locale'
import { DASHBOARD_COPY, type DashboardCopy } from '@/lib/i18n/dashboard'
import { INTL_LOCALE, OWNER_UI_COPY, fill, type OwnerUiCopy } from '@/lib/i18n/ownerUi'
import type { CatalogEntry } from '@/lib/billing/catalog'
import type { ReachTier } from '@/lib/billing/account'

export interface LedgerEntry {
  id: string
  date: string
  amount: number
  isCredit: boolean
  // 'spent' / 'earned' = redemption credit transfers (ad_credit_transfers);
  // 'usage' = the legacy per-offer pass claims (scans_and_claims).
  kind: 'topup' | 'subscription_initial' | 'subscription_renewal' | 'usage' | 'spent' | 'earned'
  campaignTitle: string | null
  // Set only for add-on billing_transactions rows (see
  // billing_transactions.addon_key's migration comment) — distinguishes an
  // add-on subscription event from a base-subscription one despite sharing
  // the same `kind` values, so the ledger doesn't mislabel an Instant Notify
  // renewal as "Subscription renewed".
  addonKey: string | null
}

// Ledger rows grouped by day. Assumes `ledger` arrives newest-first (it does
// — see src/app/dashboard/billing/page.tsx's sort), so same-day rows are
// already contiguous and a single pass suffices.
function dayLabelFor(dateStr: string, copy: DashboardCopy['billing'], locale: Locale): string {
  const d = new Date(dateStr)
  const now = new Date()
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diffDays = Math.round((startOfDay(now) - startOfDay(d)) / 86400000)
  if (diffDays === 0) return copy.todayLabel
  if (diffDays === 1) return copy.yesterdayLabel
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], { day: 'numeric', month: 'short' }).format(d)
}

function groupLedgerByDay(ledger: LedgerEntry[], copy: DashboardCopy['billing'], locale: Locale) {
  const groups: { label: string; rows: LedgerEntry[] }[] = []
  for (const row of ledger) {
    const label = dayLabelFor(row.date, copy, locale)
    const last = groups[groups.length - 1]
    if (last && last.label === label) last.rows.push(row)
    else groups.push({ label, rows: [row] })
  }
  return groups
}

function labelFor(entry: LedgerEntry, copy: DashboardCopy['billing'], o: OwnerUiCopy['billing']) {
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
    case 'spent':
      return fill(o.spentOn, { title: entry.campaignTitle ?? copy.campaignFallback })
    case 'earned':
      return o.earned
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
  isSubscriptionActive: boolean
  isInstantNotifyActive: boolean
  reachTier: ReachTier
  adCredits: number
  catalog: CatalogEntry[]
  ledger: LedgerEntry[]
}) {
  const [locale] = useLocale()
  const copy = DASHBOARD_COPY[locale].billing
  const o = OWNER_UI_COPY[locale]
  const subscriptionEntry = catalog.find((c) => c.type === 'subscription')
  const dayGroups = groupLedgerByDay(ledger, copy, locale)
  const time = new Intl.DateTimeFormat(INTL_LOCALE[locale], { hour: 'numeric', minute: '2-digit' })

  return (
    <OwnerShell
      tab="billing"
      header={<OwnerTopBar variant="subpage" title={copy.heading} backHref="/dashboard/owner" backLabel={DASHBOARD_COPY[locale].common.back} />}
    >
      <div className="flex flex-col gap-6">
        {/* Subscription + balance */}
        <section className="bg-brand-hero relative overflow-hidden rounded-[24px] p-5 text-white shadow-brand-hero">
          <div aria-hidden="true" className="bg-brand-dot-grid absolute inset-0 opacity-60" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-white/80">{o.billing.subscriptionHeading}</p>
              <p className="mt-1 flex items-center gap-2 text-[17px] font-bold">
                <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${isSubscriptionActive ? 'bg-white' : 'bg-brand-coral-brand'}`} />
                {isSubscriptionActive ? copy.active : copy.inactive}
              </p>
              {subscriptionEntry && (
                <p className="mt-1 text-sm text-white/80">
                  <bdi dir="ltr">${subscriptionEntry.amountUsd}</bdi> / {copy.perMonthSuffix}
                </p>
              )}
            </div>
            <div className="text-end">
              <p className="text-sm font-semibold text-white/80">{o.balance.label}</p>
              <p className="mt-1 font-display text-[34px] leading-none font-bold">
                <bdi dir="ltr">{adCredits.toLocaleString('en')}</bdi>
              </p>
            </div>
          </div>
        </section>

        <BillingActions
          catalog={catalog}
          isSubscriptionActive={isSubscriptionActive}
          isInstantNotifyActive={isInstantNotifyActive}
          reachTier={reachTier}
        />

        {/* History */}
        <section>
          <h2 className="mb-2.5 font-display text-[17px] font-semibold">{o.billing.historyHeading}</h2>
          {ledger.length === 0 ? (
            <EmptyState icon={<ClockIcon size={28} />} title={o.billing.emptyTitle} body={o.billing.emptyBody} />
          ) : (
            <div className="flex flex-col gap-4">
              {dayGroups.map((group) => (
                <div key={group.label}>
                  <p className="mb-1.5 text-[13px] font-semibold text-brand-muted">{group.label}</p>
                  <Card>
                    <ul>
                      {group.rows.map((row) => (
                        <li key={row.id} className="flex min-h-14 items-center justify-between gap-3 border-b border-brand-line px-4 py-2.5 last:border-b-0">
                          <div className="min-w-0">
                            <p className="text-[15px] font-semibold">
                              <bdi dir="auto" className="line-clamp-2 break-words">
                                {labelFor(row, copy, o.billing)}
                              </bdi>
                            </p>
                            <p className="text-[13px] text-brand-muted">{time.format(new Date(row.date))}</p>
                          </div>
                          <span className={`shrink-0 font-display text-[16px] font-bold ${row.amount >= 0 ? 'text-brand-navy' : 'text-brand-muted'}`}>
                            <bdi dir="ltr">
                              {row.amount >= 0 ? '+' : '−'}
                              {Math.abs(row.amount).toLocaleString('en')}
                            </bdi>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </OwnerShell>
  )
}
