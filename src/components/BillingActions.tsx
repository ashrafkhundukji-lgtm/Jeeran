'use client'

import { useState } from 'react'
import type { CatalogEntry } from '@/lib/billing/catalog'
import type { ReachTier } from '@/lib/billing/account'
import { useLocale } from '@/lib/i18n/useLocale'
import { DASHBOARD_COPY, type DashboardCopy } from '@/lib/i18n/dashboard'
import { OWNER_UI_COPY, fill } from '@/lib/i18n/ownerUi'
import { AlertIcon, ChevronForwardIcon, FlashIcon } from '@/components/customer/icons'
import { PRESS } from '@/components/customer/primitives'
import { BTN_CORAL, Card, Notice } from '@/components/owner/ui'

// Concentric-ring icon: ring count scales with reach (standard = just the
// centre, extended adds one ring, premium two). `active` = the tier the
// business currently has.
function ReachRingIcon({ tier, active }: { tier: 'standard' | 'extended' | 'premium'; active: boolean }) {
  return (
    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${active ? 'bg-brand-navy text-white' : 'bg-brand-tint text-brand-navy'}`}>
      <svg width="22" height="22" viewBox="0 0 32 32" fill="none" stroke="currentColor" aria-hidden="true">
        {tier === 'premium' && <circle cx="16" cy="16" r="14" strokeWidth="1.5" opacity="0.4" />}
        {tier !== 'standard' && <circle cx="16" cy="16" r="10.5" strokeWidth="1.75" opacity="0.6" />}
        <circle cx="16" cy="16" r="6" strokeWidth="2" />
        <circle cx="16" cy="16" r="2" fill="currentColor" />
      </svg>
    </div>
  )
}

// Maps /api/billing/checkout's own known error strings to localized copy —
// same reasoning as campaignErrorCopyFor: the route returns raw English
// text. Anything not listed here falls back to copy.checkoutError.
function billingErrorCopyFor(rawError: string, copy: DashboardCopy['billing']): string {
  switch (rawError) {
    case 'Not authenticated':
      return copy.errorNotAuthenticated
    case 'No business account found for this user':
      return copy.errorNoBusiness
    case 'Billing is not configured':
      return copy.notConfigured
    default:
      return copy.checkoutError
  }
}

// Checkout flow is unchanged (POST /api/billing/checkout with a price_id,
// redirect to Stripe). Presentation only: subscription CTA, then credit
// packages as stacked tappable cards, then reach and instant-notify add-ons.
// Prices/amounts come from the server catalog as before — "$" matches how
// the catalog (amountUsd) and webhook (p_amount_usd) model them.
export default function BillingActions({
  catalog,
  isSubscriptionActive,
  isInstantNotifyActive,
  reachTier,
}: {
  catalog: CatalogEntry[]
  isSubscriptionActive: boolean
  isInstantNotifyActive: boolean
  reachTier: ReachTier
}) {
  const [locale] = useLocale()
  const copy = DASHBOARD_COPY[locale].billing
  const o = OWNER_UI_COPY[locale].billing

  const [loadingKey, setLoadingKey] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function handleCheckout(priceId: string, key: string) {
    setLoadingKey(key)
    setError('')

    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price_id: priceId }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(billingErrorCopyFor(body.error ?? '', copy))
        setLoadingKey(null)
        return
      }
      window.location.assign(body.url)
    } catch {
      setError(copy.checkoutError)
      setLoadingKey(null)
    }
  }

  const subscriptionEntry = catalog.find((c) => c.type === 'subscription')
  const topupEntries = catalog.filter((c) => c.type === 'topup')
  // Best-value pack: highest credits-per-dollar ratio, computed here rather
  // than a stored `recommended` flag (no such flag exists in the catalog).
  const bestValueKey = topupEntries.length
    ? topupEntries.reduce((best, e) => (e.creditsGranted / e.amountUsd > best.creditsGranted / best.amountUsd ? e : best)).key
    : null
  const instantNotifyEntry = catalog.find((c) => c.type === 'addon' && c.addonKey === 'instant_notify')
  const reachExtendedEntry = catalog.find((c) => c.type === 'addon' && c.addonKey === 'reach_extended')
  const reachPremiumEntry = catalog.find((c) => c.type === 'addon' && c.addonKey === 'reach_premium')

  if (!subscriptionEntry && topupEntries.length === 0 && !instantNotifyEntry && !reachExtendedEntry && !reachPremiumEntry) {
    return (
      <Notice tone="info" icon={<AlertIcon size={20} />}>
        {copy.notConfigured}
      </Notice>
    )
  }

  const reachRow = (tier: 'extended' | 'premium', entry: CatalogEntry, label: string, description: string) => {
    const current = reachTier === tier
    return (
      <li className={`flex items-center gap-3 border-b border-brand-line px-4 py-3 last:border-b-0 ${current ? 'bg-brand-tint' : ''}`}>
        <ReachRingIcon tier={tier} active={current} />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold">{label}</p>
          <p className={`text-[13px] ${current ? 'font-semibold text-brand-navy' : 'text-brand-muted'}`}>{current ? copy.reachCurrentPlan : description}</p>
        </div>
        {!current && (
          <button
            type="button"
            onClick={() => handleCheckout(entry.priceId, entry.key)}
            disabled={loadingKey !== null}
            className={`min-h-11 shrink-0 rounded-xl bg-brand-navy px-3.5 text-sm font-semibold text-white disabled:opacity-50 ${PRESS}`}
          >
            {loadingKey === entry.key ? copy.redirecting : copy.reachSubscribe.replace('{n}', String(entry.amountUsd))}
          </button>
        )}
      </li>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <Notice tone="warning" icon={<AlertIcon size={20} />}>
          {error}
        </Notice>
      )}

      {subscriptionEntry && !isSubscriptionActive && (
        <button
          type="button"
          onClick={() => handleCheckout(subscriptionEntry.priceId, subscriptionEntry.key)}
          disabled={loadingKey !== null}
          className={`${BTN_CORAL} w-full`}
        >
          {loadingKey === subscriptionEntry.key ? copy.redirecting : copy.subscribe.replace('{n}', String(subscriptionEntry.amountUsd))}
        </button>
      )}

      {topupEntries.length > 0 && (
        <section>
          <h2 className="mb-2.5 font-display text-[17px] font-semibold">{o.packagesHeading}</h2>
          <ul className="flex flex-col gap-3">
            {topupEntries.map((entry) => {
              const isBestValue = entry.key === bestValueKey
              return (
                <li key={entry.key}>
                  <button
                    type="button"
                    onClick={() => handleCheckout(entry.priceId, entry.key)}
                    disabled={loadingKey !== null}
                    className={`flex min-h-[76px] w-full items-center gap-3 rounded-[20px] bg-white px-4 py-3 text-start disabled:opacity-60 ${PRESS} ${
                      isBestValue ? 'border-2 border-brand-coral shadow-brand-card' : 'border border-brand-line'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      {isBestValue && <span className="mb-1 inline-block rounded-full bg-brand-coral px-2.5 py-0.5 text-xs font-bold text-white">{copy.bestValue}</span>}
                      <p className="font-display text-[19px] leading-tight font-bold text-brand-navy-deep">
                        {fill(o.packageCredits, { n: entry.creditsGranted.toLocaleString('en') })}
                      </p>
                      <p className="text-[13px] text-brand-muted">
                        {fill(o.perCredit, { price: `$${((entry.amountUsd / entry.creditsGranted) * 100).toFixed(2)}` })}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-xl bg-brand-tint px-3 py-2 font-display text-[18px] font-bold text-brand-navy">
                      {loadingKey === entry.key ? '…' : <bdi dir="ltr">${entry.amountUsd}</bdi>}
                    </span>
                    <ChevronForwardIcon size={20} className="shrink-0 text-brand-muted" />
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {(reachExtendedEntry || reachPremiumEntry) && (
        <section>
          <h2 className="font-display text-[17px] font-semibold">{o.reachHeading}</h2>
          <p className="mt-0.5 mb-2.5 text-sm text-brand-muted">{copy.reachDescription}</p>
          <Card className="overflow-hidden">
            <ul>
              {/* Standard is always included — nothing to buy, the baseline every business has. */}
              <li className="flex items-center gap-3 border-b border-brand-line px-4 py-3">
                <ReachRingIcon tier="standard" active={reachTier === 'none'} />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold">{copy.reachStandardLabel}</p>
                  <p className="text-[13px] text-brand-muted">{copy.reachStandardDescription}</p>
                </div>
              </li>
              {reachExtendedEntry && reachRow('extended', reachExtendedEntry, copy.reachExtendedLabel, copy.reachExtendedDescription)}
              {reachPremiumEntry && reachRow('premium', reachPremiumEntry, copy.reachPremiumLabel, copy.reachPremiumDescription)}
            </ul>
          </Card>
        </section>
      )}

      {instantNotifyEntry && (
        <Card className="p-4">
          <div className="mb-1.5 flex items-center gap-2">
            <FlashIcon size={20} className="text-brand-coral" />
            <h2 className="font-display text-[17px] font-semibold">{copy.instantNotifyLabel}</h2>
          </div>
          <p className="mb-3.5 text-sm leading-relaxed text-brand-muted">{copy.instantNotifyDescription}</p>
          {isInstantNotifyActive ? (
            <p className="flex items-center gap-2 text-[15px] font-semibold text-brand-navy">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-brand-navy" />
              {copy.instantNotifyActive}
            </p>
          ) : (
            <button
              type="button"
              onClick={() => handleCheckout(instantNotifyEntry.priceId, instantNotifyEntry.key)}
              disabled={loadingKey !== null}
              className={`${BTN_CORAL} w-full`}
            >
              {loadingKey === instantNotifyEntry.key ? copy.redirecting : copy.instantNotifySubscribe.replace('{n}', String(instantNotifyEntry.amountUsd))}
            </button>
          )}
        </Card>
      )}
    </div>
  )
}
