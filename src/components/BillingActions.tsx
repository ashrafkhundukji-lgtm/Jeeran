'use client'

import { useState } from 'react'
import type { CatalogEntry } from '@/lib/billing/catalog'
import type { ReachTier } from '@/lib/billing/account'
import { useLocale } from '@/lib/i18n/useLocale'
import { DASHBOARD_COPY, type DashboardCopy } from '@/lib/i18n/dashboard'

// Concentric-ring icon: ring count scales with reach (standard has just the
// center dot's own small ring, extended adds one, premium adds two), same
// visual shorthand as the design canvas mockup this section was built from.
// `active` (this tier is the one currently subscribed) recolors it orange,
// matching the selected-row treatment used for the topup cards below.
function ReachRingIcon({ tier, active }: { tier: 'standard' | 'extended' | 'premium'; active: boolean }) {
  const color = active ? '#FF6B4A' : '#9ca3af'
  return (
    <div
      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${active ? 'bg-white' : 'bg-neutral-100'}`}
    >
      <svg width="20" height="20" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        {tier === 'premium' && <circle cx="16" cy="16" r="14" stroke={color} strokeWidth="1.5" opacity="0.3" />}
        {tier !== 'standard' && (
          <circle cx="16" cy="16" r="11" stroke={color} strokeWidth="1.75" opacity="0.4" />
        )}
        <circle cx="16" cy="16" r="6" stroke={color} strokeWidth="1.75" />
        <circle cx="16" cy="16" r="2" fill={color} />
      </svg>
    </div>
  )
}

// Maps /api/billing/checkout's own known error strings to localized copy —
// same reasoning as CampaignManager's campaignErrorCopyFor: the route
// returns raw English text, so showing body.error directly stayed English
// regardless of the dashboard's selected language. Anything not listed here
// (an unexpected 500, a raw Stripe error) falls back to copy.checkoutError.
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
      setError(billingErrorCopyFor(body.error ?? '', copy))
      setLoadingKey(null)
      return
    }

    window.location.href = body.url
  }

  const subscriptionEntry = catalog.find((c) => c.type === 'subscription')
  const topupEntries = catalog.filter((c) => c.type === 'topup')
  // Best-value pack: highest credits-per-dollar ratio, computed here rather
  // than a stored `recommended` flag on CatalogEntry (design_handoff_jeeran_
  // mobile/README.md §4 — no such flag exists in the catalog today).
  const bestValueKey = topupEntries.length
    ? topupEntries.reduce((best, e) => (e.creditsGranted / e.amountUsd > best.creditsGranted / best.amountUsd ? e : best)).key
    : null
  const instantNotifyEntry = catalog.find((c) => c.type === 'addon' && c.addonKey === 'instant_notify')
  const reachExtendedEntry = catalog.find((c) => c.type === 'addon' && c.addonKey === 'reach_extended')
  const reachPremiumEntry = catalog.find((c) => c.type === 'addon' && c.addonKey === 'reach_premium')

  if (
    !subscriptionEntry &&
    topupEntries.length === 0 &&
    !instantNotifyEntry &&
    !reachExtendedEntry &&
    !reachPremiumEntry
  ) {
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

      {(reachExtendedEntry || reachPremiumEntry) && (
        <div>
          <h3 className="text-sm font-medium text-neutral-700 mb-1">{copy.reachHeading}</h3>
          <p className="text-xs text-neutral-500 mb-3">{copy.reachDescription}</p>
          <div className="flex flex-col gap-2">
            {/* Standard is always included — nothing to buy, just the baseline every business already has. */}
            <div className="flex items-center gap-3 border border-neutral-200 rounded-xl p-3">
              <ReachRingIcon tier="standard" active={false} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{copy.reachStandardLabel}</div>
                <div className="text-xs text-neutral-500">{copy.reachStandardDescription}</div>
              </div>
            </div>

            {reachExtendedEntry && (
              <div
                className={`flex items-center gap-3 rounded-xl p-3 ${
                  reachTier === 'extended' ? 'border-2 border-[#FF6B4A] bg-[#FFF7F3]' : 'border border-neutral-200'
                }`}
              >
                <ReachRingIcon tier="extended" active={reachTier === 'extended'} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{copy.reachExtendedLabel}</div>
                  <div className={`text-xs ${reachTier === 'extended' ? 'text-[#FF6B4A] font-semibold' : 'text-neutral-500'}`}>
                    {reachTier === 'extended' ? copy.reachCurrentPlan : copy.reachExtendedDescription}
                  </div>
                </div>
                {reachTier !== 'extended' && (
                  <button
                    onClick={() => handleCheckout(reachExtendedEntry.priceId, reachExtendedEntry.key)}
                    disabled={loadingKey !== null}
                    className="shrink-0 bg-[#FF6B4A] text-white rounded-lg py-2 px-3 text-xs font-medium transition-colors hover:bg-[#e85a3b] disabled:opacity-50"
                  >
                    {loadingKey === reachExtendedEntry.key
                      ? copy.redirecting
                      : copy.reachSubscribe.replace('{n}', String(reachExtendedEntry.amountUsd))}
                  </button>
                )}
              </div>
            )}

            {reachPremiumEntry && (
              <div
                className={`flex items-center gap-3 rounded-xl p-3 ${
                  reachTier === 'premium' ? 'border-2 border-[#FF6B4A] bg-[#FFF7F3]' : 'border border-neutral-200'
                }`}
              >
                <ReachRingIcon tier="premium" active={reachTier === 'premium'} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{copy.reachPremiumLabel}</div>
                  <div className={`text-xs ${reachTier === 'premium' ? 'text-[#FF6B4A] font-semibold' : 'text-neutral-500'}`}>
                    {reachTier === 'premium' ? copy.reachCurrentPlan : copy.reachPremiumDescription}
                  </div>
                </div>
                {reachTier !== 'premium' && (
                  <button
                    onClick={() => handleCheckout(reachPremiumEntry.priceId, reachPremiumEntry.key)}
                    disabled={loadingKey !== null}
                    className="shrink-0 bg-[#FF6B4A] text-white rounded-lg py-2 px-3 text-xs font-medium transition-colors hover:bg-[#e85a3b] disabled:opacity-50"
                  >
                    {loadingKey === reachPremiumEntry.key
                      ? copy.redirecting
                      : copy.reachSubscribe.replace('{n}', String(reachPremiumEntry.amountUsd))}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {topupEntries.length > 0 && (
        <div>
          <h3 className="mb-2.5 text-[13px] font-semibold tracking-[0.06em] text-[#8a8a8a]">{copy.buyCredits}</h3>
          <div className="grid grid-cols-3 gap-2.5">
            {topupEntries.map((entry) => {
              const isBestValue = entry.key === bestValueKey
              return (
                <button
                  key={entry.key}
                  onClick={() => handleCheckout(entry.priceId, entry.key)}
                  disabled={loadingKey !== null}
                  className={`relative rounded-2xl p-[14px_8px] text-center transition-colors disabled:opacity-50 ${
                    isBestValue
                      ? 'border-2 border-[#FF6B4A] shadow-[0_8px_18px_-12px_rgba(255,107,74,0.7)]'
                      : 'border border-[#ececec] bg-white'
                  }`}
                >
                  {isBestValue && (
                    <span className="absolute -top-[9px] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#FF6B4A] px-2 py-[3px] text-[9.5px] font-semibold text-white">
                      {copy.bestValue}
                    </span>
                  )}
                  <div className="text-[21px] font-bold">{entry.creditsGranted.toLocaleString()}</div>
                  <div className="mt-0.5 text-[11px] text-[#8a8a8a]">{copy.creditsSuffix}</div>
                  <div className="mt-[9px] text-[13px] font-semibold">
                    {loadingKey === entry.key ? '…' : `$${entry.amountUsd}`}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {instantNotifyEntry && (
        <div className="rounded-[20px] border border-[#FF6B4A]/30 bg-[#FFF7F3] p-[17px]">
          <div className="mb-[7px] flex items-center gap-[9px]">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#FF6B4A" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" />
            </svg>
            <h3 className="text-[15px] font-semibold">{copy.instantNotifyLabel}</h3>
          </div>
          <p className="mb-3.5 text-[13px] leading-[1.6] text-[#5a5a5a]">{copy.instantNotifyDescription}</p>
          {isInstantNotifyActive ? (
            <div className="flex items-center gap-[7px]">
              <span className="h-[7px] w-[7px] rounded-full bg-[#16a34a]" aria-hidden="true" />
              <span className="text-[14px] font-semibold text-[#15803d]">{copy.instantNotifyActive}</span>
            </div>
          ) : (
            <button
              onClick={() => handleCheckout(instantNotifyEntry.priceId, instantNotifyEntry.key)}
              disabled={loadingKey !== null}
              className="rounded-[13px] bg-[#FF6B4A] px-4 py-[13px] text-[14.5px] font-semibold text-white transition-colors hover:bg-[#e85a3b] disabled:opacity-50"
            >
              {loadingKey === instantNotifyEntry.key
                ? copy.redirecting
                : copy.instantNotifySubscribe.replace('{n}', String(instantNotifyEntry.amountUsd))}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
