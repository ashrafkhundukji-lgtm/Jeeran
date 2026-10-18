'use client'

import { useEffect, type ReactNode } from 'react'
import { useLocale } from '@/lib/i18n/useLocale'
import { getDir } from '@/lib/i18n/locale'
import { BROWSE_COPY } from '@/lib/i18n/browse'
import SiteHeader from '@/components/site/SiteHeader'
import SiteFooter from '@/components/site/SiteFooter'
import { ErrorState } from '@/components/customer/States'

// The /browse page shell (header, title block, footer), shared by
// BrowseView and the route-level loading.tsx / error.tsx bodies below so the
// swap to real content doesn't jump.
export function BrowseShell({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useLocale()
  const copy = BROWSE_COPY[locale]
  return (
    <div dir={getDir(locale)} lang={locale} className="flex min-h-screen flex-col overflow-x-clip bg-brand-cream font-body text-brand-navy-deep">
      <SiteHeader locale={locale} setLocale={setLocale} current="browse" />
      <main className="mx-auto w-full max-w-[1240px] flex-1 px-[18px] pt-7 pb-12 lg:px-10 lg:pt-10">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-[28px] leading-[1.25] font-bold lg:text-[34px]">{copy.title}</h1>
          <p className="text-[15px] text-brand-muted">{copy.subtitle}</p>
        </div>
        {children}
      </main>
      <SiteFooter locale={locale} setLocale={setLocale} />
    </div>
  )
}

export function BrowseLoading() {
  return (
    <BrowseShell>
      <div aria-busy="true" className="mt-5 flex flex-col gap-3.5">
        <div className="skeleton h-[52px] w-full rounded-2xl md:max-w-[560px]" />
        <div className="skeleton h-4 w-24 rounded-full" />
        <div className="flex gap-2 overflow-hidden">
          {[88, 110, 96, 120].map((w) => (
            <div key={w} className="skeleton h-11 flex-none rounded-full" style={{ width: w }} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} aria-hidden="true" className="flex min-h-[78px] items-center gap-3 rounded-[18px] border border-brand-line bg-white p-3.5">
              <div className="skeleton h-12 w-12 flex-none rounded-full" />
              <div className="flex flex-1 flex-col gap-2">
                <div className="skeleton h-4 w-1/2 rounded-full" />
                <div className="skeleton h-3 w-1/3 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </BrowseShell>
  )
}

export function BrowseError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const [locale] = useLocale()
  useEffect(() => {
    console.error(error)
  }, [error])
  return (
    <BrowseShell>
      <div className="mt-6">
        <ErrorState locale={locale} onRetry={retry} />
      </div>
    </BrowseShell>
  )
}
