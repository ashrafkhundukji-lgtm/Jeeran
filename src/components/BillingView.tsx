'use client'

import DashboardNav from '@/components/DashboardNav'
import BillingActions from '@/components/BillingActions'
import { useLocale } from '@/lib/i18n/useLocale'
import { getDir } from '@/lib/i18n/locale'
import { DASHBOARD_COPY, type DashboardCopy } from '@/lib/i18n/dashboard'
import type { CatalogEntry } from '@/lib/billing/catalog'

export interface LedgerEntry {
  id: string
  date: string
  amount: number
  isCredit: boolean
  kind: 'topup' | 'subscription_initial' | 'subscription_renewal' | 'usage'
  campaignTitle: string | null
}

function labelFor(entry: LedgerEntry, copy: DashboardCopy['billing']) {
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
  accountName,
  isSubscriptionActive,
  adCredits,
  catalog,
  ledger,
}: {
  accountName: string
  isSubscriptionActive: boolean
  adCredits: number
  catalog: CatalogEntry[]
  ledger: LedgerEntry[]
}) {
  const [locale] = useLocale()
  const dir = getDir(locale)
  const copy = DASHBOARD_COPY[locale].billing

  return (
    <main dir={dir} className="max-w-2xl mx-auto px-4 py-10">
      <DashboardNav />
      <h1 className="text-xl font-semibold mb-1">{copy.heading}</h1>
      <p className="text-sm text-neutral-500 mb-6">{accountName}</p>

      <div className="flex items-center justify-between border border-neutral-200 rounded-xl p-4 mb-8">
        <div>
          <p className="text-xs text-neutral-500 mb-1">{copy.subscriptionStatus}</p>
          <p className={`text-sm font-semibold ${isSubscriptionActive ? 'text-emerald-600' : 'text-red-600'}`}>
            {isSubscriptionActive ? copy.active : copy.inactive}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-neutral-500 mb-1">{copy.credits}</p>
          <p className="text-sm font-semibold">{adCredits}</p>
        </div>
      </div>

      <BillingActions catalog={catalog} isSubscriptionActive={isSubscriptionActive} />

      <section className="mt-10">
        <h2 className="text-lg font-semibold mb-3">{copy.history}</h2>
        {ledger.length === 0 ? (
          <p className="text-sm text-neutral-400">{copy.noActivity}</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {ledger.map((row) => (
              <div
                key={row.id}
                className="flex items-center justify-between text-sm border-b border-neutral-100 py-2"
              >
                <div>
                  <div>{labelFor(row, copy)}</div>
                  <div className="text-xs text-neutral-400">{new Date(row.date).toLocaleString()}</div>
                </div>
                <div className={row.isCredit ? 'text-emerald-600 font-medium' : 'text-neutral-500'}>
                  {row.amount >= 0 ? '+' : ''}
                  {row.amount}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
