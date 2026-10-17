'use client'

import { useEffect, useState } from 'react'
import { useLocale } from '@/lib/i18n/useLocale'
import { DASHBOARD_COPY } from '@/lib/i18n/dashboard'
import { OWNER_UI_COPY } from '@/lib/i18n/ownerUi'
import { EmptyState } from '@/components/customer/States'
import { ChartIcon, RefreshIcon } from '@/components/customer/icons'
import { BTN_SECONDARY, Card } from '@/components/owner/ui'

interface LeaderboardEntry {
  businessId: string
  businessName: string
  newCustomers: number
}

type State = { kind: 'loading' } | { kind: 'error' } | { kind: 'ready'; entries: LeaderboardEntry[] }

// Purely informational (Phase 4, item 10) — no credit, no ranking effect
// anywhere else tied to appearing here. Ranked by genuine new-customer
// scans only (first-time wallet downloads), never rescans — see
// top_shops_by_new_customers() / src/lib/leaderboard.ts. Ranking untouched;
// this adds real loading / empty / error states (previously a failed or
// non-JSON response could leave it on the loading text).
export default function NewCustomerLeaderboard({ businessId }: { businessId: string }) {
  const [locale] = useLocale()
  const copy = DASHBOARD_COPY[locale].leaderboard
  const o = OWNER_UI_COPY[locale]

  const [period, setPeriod] = useState<'week' | 'month'>('week')
  const [state, setState] = useState<State>({ kind: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    let cancelled = false // effect cleanup (period switch / unmount), not a failure
    const timeout = setTimeout(() => controller.abort(), 15_000)
    fetch(`/api/dashboard/leaderboard?period=${period}`, { signal: controller.signal, cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status))
        const body = await res.json()
        if (!cancelled) setState({ kind: 'ready', entries: Array.isArray(body.entries) ? body.entries : [] })
      })
      .catch(() => {
        if (!cancelled) setState({ kind: 'error' })
      })
      .finally(() => clearTimeout(timeout))
    return () => {
      cancelled = true
      clearTimeout(timeout)
      controller.abort()
    }
  }, [period, attempt])

  return (
    <section>
      <p className="mb-4 text-sm leading-relaxed text-brand-muted">{copy.subtitle}</p>

      <div role="tablist" aria-label={copy.heading} className="mb-4 grid grid-cols-2 gap-1 rounded-2xl bg-brand-tint p-1">
        {(['week', 'month'] as const).map((p) => (
          <button
            key={p}
            type="button"
            role="tab"
            aria-selected={period === p}
            onClick={() => {
              if (p === period) return
              setState({ kind: 'loading' })
              setPeriod(p)
            }}
            className={`min-h-11 rounded-xl text-[15px] font-semibold transition-colors ${
              period === p ? 'bg-white text-brand-navy shadow-sm' : 'text-brand-muted'
            }`}
          >
            {p === 'week' ? copy.weekTab : copy.monthTab}
          </button>
        ))}
      </div>

      {state.kind === 'loading' && (
        <Card className="p-2">
          <div aria-busy="true" aria-label={copy.loading} className="flex flex-col">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex min-h-14 items-center gap-3 px-2">
                <div className="skeleton h-8 w-8 rounded-full" />
                <div className="skeleton h-4 flex-1 rounded-full" />
                <div className="skeleton h-4 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </Card>
      )}

      {state.kind === 'error' && (
        <EmptyState
          icon={<RefreshIcon size={28} />}
          title={o.leaderboard.errorTitle}
          body={o.common.errorBody}
          action={
            <button type="button" onClick={() => {
                setState({ kind: 'loading' })
                setAttempt((a) => a + 1)
              }} className={`${BTN_SECONDARY} mt-1`}>
              <RefreshIcon size={18} />
              {o.common.retry}
            </button>
          }
        />
      )}

      {state.kind === 'ready' && state.entries.length === 0 && (
        <EmptyState
          icon={<ChartIcon size={28} />}
          title={period === 'week' ? o.leaderboard.emptyWeekTitle : o.leaderboard.emptyMonthTitle}
          body={o.leaderboard.emptyBody}
          action={
            <a href="/dashboard/owner#qr-sheet" className={`${BTN_SECONDARY} mt-1`}>
              {o.qr.heading}
            </a>
          }
        />
      )}

      {state.kind === 'ready' && state.entries.length > 0 && (
        <Card>
          <ol>
            {state.entries.map((entry, i) => {
              const isYou = entry.businessId === businessId
              return (
                <li
                  key={entry.businessId}
                  className={`flex min-h-14 items-center gap-3 border-b border-brand-line px-4 py-2 last:border-b-0 ${isYou ? 'bg-brand-tint' : ''}`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold ${
                      i < 3 ? 'bg-brand-navy text-white' : 'bg-brand-tint text-brand-navy'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 text-[15px] font-semibold">
                    <bdi dir="auto" className="line-clamp-1 break-all">
                      {entry.businessName}
                    </bdi>
                    {isYou && <span className="ms-1.5 text-[13px] font-bold text-brand-coral">({copy.you})</span>}
                  </span>
                  <span className="shrink-0 text-[13px] text-brand-muted">{copy.newCustomers.replace('{n}', String(entry.newCustomers))}</span>
                </li>
              )
            })}
          </ol>
        </Card>
      )}
    </section>
  )
}
