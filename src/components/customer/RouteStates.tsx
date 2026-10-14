'use client'

import { useEffect } from 'react'
import { useLocale } from '@/lib/i18n/useLocale'
import { getDir } from '@/lib/i18n/locale'
import CustomerPage from './CustomerPage'
import { ErrorState, OfferListSkeleton } from './States'

// Route-level loading.tsx / error.tsx bodies for the customer pages
// (wallet home, offers, shops). Same shell as the real pages, so the
// skeleton → content swap doesn't jump.

export function CustomerRouteLoading() {
  const [locale] = useLocale()
  return (
    <CustomerPage dir={getDir(locale)} lang={locale}>
      <div aria-busy="true" className="flex flex-col gap-4 px-6 pt-6">
        <div className="skeleton h-8 w-1/2 rounded-full" />
        <div className="skeleton h-[52px] rounded-2xl" />
        <OfferListSkeleton />
      </div>
    </CustomerPage>
  )
}

// Quiet retry card. unstable_retry() is this Next version's re-fetch +
// re-render of the failed segment (see node_modules/next/dist/docs, error.js).
export function CustomerRouteError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const [locale] = useLocale()
  useEffect(() => {
    console.error(error)
  }, [error])
  return (
    <CustomerPage dir={getDir(locale)} lang={locale}>
      <div className="px-6 pt-10">
        <ErrorState locale={locale} onRetry={retry} />
      </div>
    </CustomerPage>
  )
}
