'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLocale } from '@/lib/i18n/useLocale'
import { getDir } from '@/lib/i18n/locale'
import { VALIDATE_COPY } from '@/lib/i18n/validate'
import SiteHeader from '@/components/site/SiteHeader'
import SiteFooter from '@/components/site/SiteFooter'
import { AlertIcon, CheckIcon, CloseIcon } from '@/components/customer/icons'

function ValidateInner() {
  const searchParams = useSearchParams()
  const claim = searchParams.get('claim') || ''
  const hash = searchParams.get('hash') || ''
  const [locale, setLocale] = useLocale()
  const copy = VALIDATE_COPY[locale]
  const dir = getDir(locale)

  const [status, setStatus] = useState<'idle' | 'working' | 'success' | 'error'>('idle')
  const [result, setResult] = useState<{ title?: string; error?: string }>({})

  async function handleConfirm() {
    setStatus('working')
    const res = await fetch('/api/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ claim, hash }),
    })
    const body = await res.json().catch(() => ({}))

    if (!res.ok) {
      setStatus('error')
      setResult({ error: body.error || copy.fallbackError })
      return
    }

    setStatus('success')
    setResult({ title: body.title })
  }

  // Full-screen result states — big and unmistakable for staff at a counter.
  if (status === 'success' || status === 'error') {
    const ok = status === 'success'
    return (
      <div
        dir={dir}
        lang={locale}
        role="status"
        className={`flex min-h-screen flex-col items-center justify-center px-6 text-center font-body text-white ${ok ? 'bg-brand-navy' : 'bg-brand-coral'}`}
      >
        <span className={`mb-5 flex h-20 w-20 items-center justify-center rounded-full ${ok ? 'bg-white text-brand-navy' : 'bg-white/20 text-white'}`}>
          {ok ? <CheckIcon size={40} strokeWidth={2.4} /> : <CloseIcon size={40} strokeWidth={2.4} />}
        </span>
        <h1 className="mb-2 font-display text-2xl font-bold">{ok ? copy.validTitle : copy.invalidTitle}</h1>
        <p className="max-w-[28em] text-lg text-white/90">{ok ? result.title : result.error}</p>
      </div>
    )
  }

  return (
    <div dir={dir} lang={locale} className="flex min-h-screen flex-col bg-brand-cream font-body text-brand-navy-deep">
      <SiteHeader locale={locale} setLocale={setLocale} />

      <main className="mx-auto w-full max-w-[480px] flex-1 px-[18px] pt-12 pb-16 lg:pt-20">
        {!claim || !hash ? (
          <div role="alert" className="flex items-start gap-2.5 rounded-xl bg-[#FDEEE9] px-4 py-3.5 text-[15px] text-[#8A2410]">
            <AlertIcon size={20} strokeWidth={1.8} className="mt-0.5 flex-none" />
            <span>{copy.missingLink}</span>
          </div>
        ) : (
          <div className="rounded-3xl border border-brand-line bg-white p-6 text-center shadow-brand-card">
            <h1 className="mb-2 font-display text-[24px] leading-[1.3] font-bold">{copy.title}</h1>
            <p className="mb-6 text-[15px] leading-[1.7] text-brand-muted">{copy.body}</p>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={status === 'working'}
              aria-busy={status === 'working'}
              className="flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-[14px] bg-brand-coral font-display text-[17px] font-semibold text-white transition-colors hover:bg-[#B5330F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-navy disabled:cursor-wait disabled:opacity-80 motion-reduce:transition-none"
            >
              {status === 'working' && (
                <span aria-hidden="true" className="h-[18px] w-[18px] animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none" />
              )}
              {status === 'working' ? copy.checking : copy.confirm}
            </button>
          </div>
        )}
      </main>

      <SiteFooter locale={locale} setLocale={setLocale} />
    </div>
  )
}

export default function ValidatePage() {
  return (
    <Suspense>
      <ValidateInner />
    </Suspense>
  )
}
