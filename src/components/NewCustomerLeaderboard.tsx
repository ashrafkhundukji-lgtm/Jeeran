'use client'

import { useEffect, useState } from 'react'
import { useLocale } from '@/lib/i18n/useLocale'
import { DASHBOARD_COPY } from '@/lib/i18n/dashboard'

interface LeaderboardEntry {
  businessId: string
  businessName: string
  newCustomers: number
}

// Purely informational (Phase 4, item 10) — no credit, no ranking effect
// anywhere else tied to appearing here. Ranked by genuine new-customer
// scans only (first-time wallet downloads), never rescans — see
// top_shops_by_new_customers() / src/lib/leaderboard.ts.
export default function NewCustomerLeaderboard({ businessId }: { businessId: string }) {
  const [locale] = useLocale()
  const copy = DASHBOARD_COPY[locale].leaderboard

  const [period, setPeriod] = useState<'week' | 'month'>('week')
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null)

  useEffect(() => {
    let cancelled = false
    setEntries(null)
    fetch(`/api/dashboard/leaderboard?period=${period}`)
      .then((res) => res.json())
      .then((body) => {
        if (!cancelled) setEntries(body.entries ?? [])
      })
      .catch(() => {
        if (!cancelled) setEntries([])
      })
    return () => {
      cancelled = true
    }
  }, [period])

  return (
    <section className="border border-neutral-200 rounded-xl p-4 mb-10">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold">{copy.heading}</h2>
        <div className="flex items-center gap-1 bg-[#1E3A8A]/5 rounded-lg p-1">
          {(['week', 'month'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`text-xs font-medium rounded-md px-2.5 py-1 transition-colors ${
                period === p ? 'bg-[#1E3A8A] text-white shadow-sm' : 'text-[#5a5a5a] hover:text-[#1a1a1a]'
              }`}
            >
              {p === 'week' ? copy.weekTab : copy.monthTab}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-neutral-400 mb-3">{copy.subtitle}</p>

      {entries === null ? (
        <p className="text-sm text-neutral-400">{copy.loading}</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-neutral-400">{copy.empty}</p>
      ) : (
        <ol className="flex flex-col gap-1.5">
          {entries.map((entry, i) => {
            const isYou = entry.businessId === businessId
            return (
              <li
                key={entry.businessId}
                className={`flex items-center justify-between text-sm rounded-lg px-2.5 py-1.5 ${
                  isYou ? 'bg-[#FF6B4A]/10' : ''
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="text-xs text-neutral-400 w-4 text-right">{i + 1}</span>
                  <span className={isYou ? 'font-medium text-[#1a1a1a]' : 'text-neutral-700'}>
                    {entry.businessName}
                    {isYou && <span className="text-xs text-[#FF6B4A] ms-1.5">({copy.you})</span>}
                  </span>
                </span>
                <span className="text-xs text-neutral-500">{copy.newCustomers.replace('{n}', String(entry.newCustomers))}</span>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
