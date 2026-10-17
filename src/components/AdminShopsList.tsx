'use client'

import { useMemo, useState } from 'react'
import LevelBadge from '@/components/LevelBadge'
import { CATEGORIES } from '@/lib/categories'
import type { AdminShopRow, BillingStatus } from '@/lib/admin'

const BILLING_LABELS: Record<BillingStatus, string> = {
  paid: 'Paid',
  trial: 'Trial',
  lapsed: 'Lapsed',
}

const BILLING_STYLES: Record<BillingStatus, string> = {
  paid: 'bg-brand-tint text-brand-navy',
  trial: 'bg-brand-tint text-brand-navy-deep',
  lapsed: 'bg-brand-coral-tint text-brand-coral',
}

export default function AdminShopsList({ shops: initialShops }: { shops: AdminShopRow[] }) {
  const [shops, setShops] = useState(initialShops)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [billingStatus, setBillingStatus] = useState<'all' | BillingStatus>('all')
  const [frozenFilter, setFrozenFilter] = useState<'all' | 'frozen' | 'active'>('all')
  const [pendingFreezeId, setPendingFreezeId] = useState<string | null>(null)
  const [freezeReason, setFreezeReason] = useState('')
  const [actionError, setActionError] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return shops.filter((s) => {
      if (q) {
        const haystack = `${s.name} ${s.ownerEmail ?? ''} ${s.id}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      if (category !== 'all' && s.category !== category) return false
      if (billingStatus !== 'all' && s.billingStatus !== billingStatus) return false
      if (frozenFilter === 'frozen' && !s.isFrozen) return false
      if (frozenFilter === 'active' && s.isFrozen) return false
      return true
    })
  }, [shops, query, category, billingStatus, frozenFilter])

  async function applyFreeze(id: string, isFrozen: boolean, reason?: string) {
    setActionError('')
    const res = await fetch(`/api/admin/shops/${id}/freeze`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_frozen: isFrozen, reason }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setActionError(body.error || 'Could not update shop')
      return
    }
    setShops((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isFrozen, frozenReason: isFrozen ? reason ?? null : null } : s)),
    )
    setPendingFreezeId(null)
    setFreezeReason('')
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          placeholder="Search by name, owner email, or id"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 min-w-[220px] border border-brand-line rounded-lg px-3 py-2 text-sm"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border border-brand-line rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={billingStatus}
          onChange={(e) => setBillingStatus(e.target.value as 'all' | BillingStatus)}
          className="border border-brand-line rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">All billing statuses</option>
          <option value="paid">Paid</option>
          <option value="trial">Trial</option>
          <option value="lapsed">Lapsed</option>
        </select>
        <select
          value={frozenFilter}
          onChange={(e) => setFrozenFilter(e.target.value as 'all' | 'frozen' | 'active')}
          className="border border-brand-line rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="active">Not frozen</option>
          <option value="frozen">Frozen</option>
        </select>
      </div>

      <p className="text-xs text-brand-muted mb-3">
        {filtered.length} of {shops.length} shops
      </p>

      {actionError && <p className="text-sm text-brand-coral mb-3">{actionError}</p>}

      <div className="flex flex-col gap-2">
        {filtered.length === 0 && <p className="text-sm text-brand-muted py-6 text-center">No shops match.</p>}
        {filtered.map((shop) => (
          <div
            key={shop.id}
            className={`border rounded-lg px-4 py-3 ${
              shop.isFrozen ? 'border-brand-coral/30 bg-brand-coral-tint/30' : 'border-brand-line'
            }`}
          >
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="flex items-center gap-2 min-w-[220px]">
                <LevelBadge level={shop.promotionLevel} variant="chip" />
                <div>
                  <div className="font-medium text-sm text-brand-navy-deep">{shop.name}</div>
                  <div className="text-xs text-brand-muted">
                    {shop.category} · {shop.ownerEmail ?? '—'}
                  </div>
                  <div className="text-xs text-brand-muted">{shop.id}</div>
                </div>
              </div>

              <Stat label="Credits" value={shop.adCredits} />
              <Stat label="Redemptions" value={shop.promotionScore} />
              <Stat label="Scans" value={shop.scansHosted} />

              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${BILLING_STYLES[shop.billingStatus]}`}
              >
                {BILLING_LABELS[shop.billingStatus]}
              </span>

              {shop.isFrozen && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-brand-coral-tint text-brand-coral">Frozen</span>
              )}

              <div className="ml-auto flex items-center gap-2">
                {shop.latitude != null && shop.longitude != null && (
                  <a
                    href={`https://www.google.com/maps?q=${shop.latitude},${shop.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-brand-muted underline"
                  >
                    Map
                  </a>
                )}
                {shop.isFrozen ? (
                  <button
                    onClick={() => applyFreeze(shop.id, false)}
                    className="text-xs font-medium px-2.5 py-1 rounded-full bg-brand-navy text-white hover:bg-brand-navy-deep transition-colors"
                  >
                    Unfreeze
                  </button>
                ) : pendingFreezeId === shop.id ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      autoFocus
                      placeholder="Reason (optional)"
                      value={freezeReason}
                      onChange={(e) => setFreezeReason(e.target.value)}
                      className="border border-brand-line rounded-lg px-2 py-1 text-xs w-40"
                    />
                    <button
                      onClick={() => applyFreeze(shop.id, true, freezeReason)}
                      className="text-xs font-medium px-2.5 py-1 rounded-full bg-brand-coral text-white hover:bg-brand-coral/90 transition-colors"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => {
                        setPendingFreezeId(null)
                        setFreezeReason('')
                      }}
                      className="text-xs text-brand-muted"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setPendingFreezeId(shop.id)}
                    className="text-xs font-medium px-2.5 py-1 rounded-full border border-brand-coral/30 text-brand-coral hover:bg-brand-coral-tint transition-colors"
                  >
                    Freeze
                  </button>
                )}
              </div>
            </div>

            {shop.activeCampaign && (
              <div className="text-xs text-brand-muted mt-2">
                Active campaign: {shop.activeCampaign.title} · {shop.activeCampaign.bidPerView} credits/view
              </div>
            )}
            {shop.frozenReason && <div className="text-xs text-brand-coral mt-2">Frozen reason: {shop.frozenReason}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-xs text-brand-muted">
      {label}: <span className="text-brand-navy-deep font-medium">{value}</span>
    </div>
  )
}
