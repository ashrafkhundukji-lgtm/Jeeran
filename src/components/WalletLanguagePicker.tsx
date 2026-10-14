'use client'

import { useState } from 'react'
import { useLocale } from '@/lib/i18n/useLocale'
import { LOCALES, detectDeviceLocale, getDir, type Locale } from '@/lib/i18n/locale'
import { WALLET_LANGUAGE_COPY } from '@/lib/i18n/walletLanguage'
import CustomerPage from '@/components/customer/CustomerPage'
import BottomNav, { NAV_CLEARANCE } from '@/components/customer/BottomNav'
import { CheckIcon } from '@/components/customer/icons'

// The Language tab — a native settings-list (grouped rows, trailing
// checkmark on the selected one) rather than the individual bordered
// buttons this used before. Two DIFFERENT locale concepts share this
// screen, deliberately kept separate: useLocale() below just picks which
// language THIS PAGE's own text renders in (same localStorage mechanism as
// every other public page), while tapping a row is the actual point of the
// page — persisting wallet_members.preferred_language via the API route,
// which is what changes the WALLET CARD's language, not this page's.
export default function WalletLanguagePicker({
  token,
  initialLocale,
}: {
  token: string
  initialLocale: Locale | null
}) {
  const [pageLocale, setPageLocale] = useLocale()
  const copy = WALLET_LANGUAGE_COPY[pageLocale]
  const dir = getDir(pageLocale)

  const [walletLocale, setWalletLocale] = useState<Locale | null>(initialLocale)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  async function choose(next: Locale | null) {
    const previous = walletLocale
    const previousPage = pageLocale
    setWalletLocale(next)
    // The site's own text follows the same choice (see WalletLocaleSync) —
    // switch it now rather than on the next page load.
    setPageLocale(next ?? detectDeviceLocale())
    setStatus('saving')
    try {
      const res = await fetch('/api/wallet/membership/language', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, locale: next }),
      })
      if (!res.ok) throw new Error('request failed')
      setStatus('saved')
    } catch {
      setWalletLocale(previous) // failed save shouldn't leave the UI claiming a choice that never persisted
      setPageLocale(previousPage)
      setStatus('error')
    }
  }

  const rows: { key: Locale | 'auto'; label: string; hint?: string; selected: boolean; onSelect: () => void }[] = [
    { key: 'auto', label: copy.automatic, hint: copy.automaticHint, selected: walletLocale === null, onSelect: () => choose(null) },
    ...LOCALES.map((l) => ({
      key: l.code,
      label: `${l.label} (${l.code.toUpperCase()})`,
      selected: walletLocale === l.code,
      onSelect: () => choose(l.code),
    })),
  ]

  return (
    <CustomerPage dir={dir} lang={pageLocale} clearance={NAV_CLEARANCE}>
      <div className="flex flex-col gap-4 px-6 pt-6">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-[28px] leading-[1.25] font-bold text-brand-navy-deep">{copy.heading}</h1>
          <p className="text-[15px] leading-relaxed text-brand-muted">{copy.body}</p>
        </div>

        <div className="overflow-hidden rounded-[22px] border border-brand-line bg-white">
          {rows.map((row, i) => (
            <button
              key={row.key}
              type="button"
              onClick={row.onSelect}
              aria-pressed={row.selected}
              className={`flex min-h-[56px] w-full items-center justify-between gap-3 px-4 py-3.5 text-start transition-colors active:bg-brand-tint ${
                i > 0 ? 'border-t border-brand-line' : ''
              } ${row.selected ? 'bg-brand-tint' : ''}`}
            >
              <div>
                <div className={`text-[15px] ${row.selected ? 'font-bold text-brand-navy' : 'font-medium text-brand-navy-deep'}`}>
                  {row.label}
                </div>
                {row.hint && <div className="mt-0.5 text-xs text-brand-muted">{row.hint}</div>}
              </div>
              {row.selected && (
                <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-brand-navy text-white">
                  <CheckIcon size={16} strokeWidth={2.6} />
                </span>
              )}
            </button>
          ))}
        </div>

        <div role="status" className="min-h-5 text-[13px] font-medium">
          {status === 'saving' && <span className="text-brand-muted">{copy.saving}</span>}
          {status === 'saved' && <span className="text-brand-navy">{copy.saved}</span>}
          {status === 'error' && <span className="text-brand-coral">{copy.error}</span>}
        </div>
      </div>

      <BottomNav token={token} active="language" />
    </CustomerPage>
  )
}
