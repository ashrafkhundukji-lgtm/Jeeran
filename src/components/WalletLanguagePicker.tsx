'use client'

import { useState } from 'react'
import { useLocale } from '@/lib/i18n/useLocale'
import { LOCALES, getDir, type Locale } from '@/lib/i18n/locale'
import { WALLET_LANGUAGE_COPY } from '@/lib/i18n/walletLanguage'
import WalletTabBar from '@/components/WalletTabBar'
import SiteLogo from '@/components/SiteLogo'

const ARCHIVO = 'font-[family-name:var(--font-archivo)]'

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
  const [pageLocale] = useLocale()
  const copy = WALLET_LANGUAGE_COPY[pageLocale]
  const dir = getDir(pageLocale)

  const [walletLocale, setWalletLocale] = useState<Locale | null>(initialLocale)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  async function choose(next: Locale | null) {
    const previous = walletLocale
    setWalletLocale(next)
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
    <main dir={dir} className="min-h-screen bg-[#FBFCFD] pb-24 text-[#1a1a1a]">
      <div className="mx-auto max-w-[480px] px-6 pt-8 sm:px-8">
        <SiteLogo className="mb-5 h-8" href={`/wallet/home?token=${encodeURIComponent(token)}`} />
        <h1 className={`${ARCHIVO} mb-1 text-[24px] font-bold tracking-[-0.01em]`}>{copy.heading}</h1>
        <p className="mb-6 text-sm text-neutral-600">{copy.body}</p>

        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          {rows.map((row, i) => (
            <button
              key={row.key}
              type="button"
              onClick={row.onSelect}
              aria-pressed={row.selected}
              className={`flex w-full items-center justify-between px-4 py-4 text-start transition-colors ${
                i > 0 ? 'border-t border-neutral-200' : ''
              } ${row.selected ? 'bg-[#FF6B4A]/5' : 'hover:bg-neutral-50'}`}
            >
              <div>
                <div className={`text-[15px] ${row.selected ? 'font-semibold text-[#FF6B4A]' : 'font-medium'}`}>
                  {row.label}
                </div>
                {row.hint && <div className="mt-0.5 text-xs text-neutral-400">{row.hint}</div>}
              </div>
              {row.selected && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF6B4A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>

        <div className="h-5 pt-3 text-xs">
          {status === 'saving' && <span className="text-neutral-400">{copy.saving}</span>}
          {status === 'saved' && <span className="text-green-600">{copy.saved}</span>}
          {status === 'error' && <span className="text-red-600">{copy.error}</span>}
        </div>
      </div>

      <WalletTabBar token={token} active="language" />
    </main>
  )
}
