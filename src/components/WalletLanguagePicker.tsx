'use client'

import { useState } from 'react'
import { useLocale } from '@/lib/i18n/useLocale'
import { LOCALES, getDir, type Locale } from '@/lib/i18n/locale'
import { WALLET_LANGUAGE_COPY } from '@/lib/i18n/walletLanguage'
import WalletSiteHeader from '@/components/WalletSiteHeader'

const ARCHIVO = 'font-[family-name:var(--font-archivo)]'

// Reached only via a signed member token from the Wallet card's own "Change
// language" link. Two DIFFERENT locale concepts share this screen,
// deliberately kept separate: useLocale() below just picks which language
// THIS PAGE's own text renders in (same localStorage mechanism as every
// other public page — see OfferPageView.tsx; WalletSiteHeader's own
// LanguageSwitcher controls the same thing, no separate picker needed here
// anymore), while the button grid is the actual point of the page —
// persisting wallet_members.preferred_language via the API route, which is
// what changes the WALLET CARD's language, not this page's.
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

  return (
    <main dir={dir} className={`min-h-screen bg-[#FBFCFD] text-[#1a1a1a] ${ARCHIVO}`}>
      <WalletSiteHeader token={token} />
      <div className="mx-auto flex max-w-[480px] flex-col items-center gap-6 px-6 pt-10 pb-12 text-center sm:px-8">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold">{copy.heading}</h1>
          <p className="text-sm text-neutral-600">{copy.body}</p>
        </div>

        <div className="flex w-full flex-col gap-2">
          <button
            type="button"
            onClick={() => choose(null)}
            aria-pressed={walletLocale === null}
            className={`w-full rounded-2xl border px-4 py-3 text-start transition-colors ${
              walletLocale === null
                ? 'border-[#FF6B4A] bg-[#FF6B4A]/5'
                : 'border-neutral-200 bg-white hover:bg-neutral-50'
            }`}
          >
            <div className="text-sm font-medium">{copy.automatic}</div>
            <div className="text-xs text-neutral-500">{copy.automaticHint}</div>
          </button>

          {LOCALES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => choose(l.code)}
              aria-pressed={walletLocale === l.code}
              className={`w-full rounded-2xl border px-4 py-3 text-start transition-colors ${
                walletLocale === l.code
                  ? 'border-[#FF6B4A] bg-[#FF6B4A]/5'
                  : 'border-neutral-200 bg-white hover:bg-neutral-50'
              }`}
            >
              <div className="text-sm font-medium">
                {l.label} ({l.code.toUpperCase()})
              </div>
            </button>
          ))}
        </div>

        <div className="h-5 text-xs">
          {status === 'saving' && <span className="text-neutral-400">{copy.saving}</span>}
          {status === 'saved' && <span className="text-green-600">{copy.saved}</span>}
          {status === 'error' && <span className="text-red-600">{copy.error}</span>}
        </div>
      </div>
    </main>
  )
}
