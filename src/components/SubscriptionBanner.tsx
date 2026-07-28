'use client'

import { useLocale } from '@/lib/i18n/useLocale'
import { DASHBOARD_COPY } from '@/lib/i18n/dashboard'

export default function SubscriptionBanner({
  isSubscriptionActive,
  adCredits,
}: {
  isSubscriptionActive: boolean
  adCredits: number
}) {
  const [locale] = useLocale()
  const copy = DASHBOARD_COPY[locale].subscriptionBanner

  if (isSubscriptionActive && adCredits > 0) return null

  return (
    <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
      {!isSubscriptionActive ? <>{copy.inactiveMessage} </> : <>{copy.noCreditsMessage} </>}
      <a href="/dashboard/billing" className="underline font-medium">
        {copy.manageBilling}
      </a>
    </div>
  )
}
