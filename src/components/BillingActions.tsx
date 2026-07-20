'use client'

import { useState } from 'react'
import type { CatalogEntry } from '@/lib/billing/catalog'

export default function BillingActions({
  catalog,
  isSubscriptionActive,
}: {
  catalog: CatalogEntry[]
  isSubscriptionActive: boolean
}) {
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
      setError(body.error || 'Could not start checkout')
      setLoadingKey(null)
      return
    }

    window.location.href = body.url
  }

  const subscriptionEntry = catalog.find((c) => c.type === 'subscription')
  const topupEntries = catalog.filter((c) => c.type === 'topup')

  if (!subscriptionEntry && topupEntries.length === 0) {
    return <p className="text-sm text-neutral-400">Billing isn&apos;t configured yet.</p>
  }

  return (
    <div className="flex flex-col gap-6">
      {error && <p className="text-sm text-red-600">{error}</p>}

      {subscriptionEntry && !isSubscriptionActive && (
        <button
          onClick={() => handleCheckout(subscriptionEntry.priceId, subscriptionEntry.key)}
          disabled={loadingKey !== null}
          className="bg-black text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-50"
        >
          {loadingKey === subscriptionEntry.key ? 'Redirecting…' : `Subscribe — $${subscriptionEntry.amountUsd}/mo`}
        </button>
      )}

      {topupEntries.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-neutral-700 mb-2">Buy Credits</h3>
          <div className="grid grid-cols-3 gap-3">
            {topupEntries.map((entry) => (
              <button
                key={entry.key}
                onClick={() => handleCheckout(entry.priceId, entry.key)}
                disabled={loadingKey !== null}
                className="border border-neutral-200 rounded-xl p-4 text-center hover:border-neutral-400 transition-colors disabled:opacity-50"
              >
                <div className="text-lg font-semibold">{entry.creditsGranted.toLocaleString()}</div>
                <div className="text-xs text-neutral-500 mb-2">credits</div>
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
