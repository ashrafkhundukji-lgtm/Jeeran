'use client'

import { useState } from 'react'
import type { CatalogEntry } from '@/lib/billing/catalog'
import { useLocale } from '@/lib/i18n/useLocale'
import { DASHBOARD_COPY } from '@/lib/i18n/dashboard'

export default function BillingActions({
  catalog,
  isSubscriptionActive,
}: {
  catalog: CatalogEntry[]
  isSubscriptionActive: boolean
}) {
  const [locale] = useLocale()
  const copy = DASHBOARD_COPY[locale].billing

  const [loadingKey, setLoadingKey] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function handleCheckout(priceId: string, key: string) {
    setLoadingKey(key)
    setError('')

    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price_id: priceId }),
    })
    const body = await res.json().catch(() => ({}))

    if (!res.ok) {
      setError(body.error || copy.checkoutError)
      setLoadingKey(null)
      return
    }

    window.location.href = body.url
  }

  const subscriptionEntry = catalog.find((c) => c.type === 'subscription')
  const topupEntries = catalog.filter((c) => c.type === 'topup')

  if (!subscriptionEntry && topupEntries.length === 0) {
    return <p className="text-sm text-neutral-400">{copy.notConfigured}</p>
  }

  return (
    <div className="flex flex-col gap-6">
      {error && <p className="text-sm text-red-600">{error}</p>}

      {subscriptionEntry && !isSubscriptionActive && (
        <button
          onClick={() => handleCheckout(subscriptionEntry.priceId, subscriptionEntry.key)}
          disabled={loadingKey !== null}
          className="bg-[#FF6B4A] text-white rounded-lg py-2.5 text-sm font-medium transition-colors hover:bg-[#e85a3b] disabled:opacity-50"
        >
          {loadingKey === subscriptionEntry.key
            ? copy.redirecting
            : copy.subscribe.replace('{n}', String(subscriptionEntry.amountUsd))}
        </button>
      )}

      {topupEntries.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-neutral-700 mb-2">{copy.buyCredits}</h3>
          <div className="grid grid-cols-3 gap-3">
            {topupEntries.map((entry) => (
              <button
                key={entry.key}
                onClick={() => handleCheckout(entry.priceId, entry.key)}
                disabled={loadingKey !== null}
                className="border border-neutral-200 rounded-xl p-4 text-center hover:border-[#1E3A8A] transition-colors disabled:opacity-50"
              >
                <div className="text-lg font-semibold">{entry.creditsGranted.toLocaleString()}</div>
                <div className="text-xs text-neutral-500 mb-2">{copy.creditsSuffix}</div>
                <div className="text-sm font-medium">
                  {loadingKey === entry.key ? '…' : `$${entry.amountUsd}`}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
