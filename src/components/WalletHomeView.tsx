'use client'

import { useLocale } from '@/lib/i18n/useLocale'
import { getDir } from '@/lib/i18n/locale'
import { WALLET_HOME_COPY } from '@/lib/i18n/walletHome'
import WalletSiteHeader from '@/components/WalletSiteHeader'

const ARCHIVO = 'font-[family-name:var(--font-archivo)]'

// The hub every "Home" link in WalletSiteHeader points to — what a customer
// tapping the Wallet card's various links (View offer, Other offers nearby,
// Shops near you, Change language) previously had no common place to land
// on together. No data fetch of its own: every row just carries the same
// member token forward to the page it already exists for.
export default function WalletHomeView({ token }: { token: string }) {
  const [locale] = useLocale()
  const dir = getDir(locale)
  const copy = WALLET_HOME_COPY[locale]
  const q = `?token=${encodeURIComponent(token)}`

  const items = [
    { href: `/offers/nearby${q}`, emoji: '🏷️', title: copy.offersTitle, subtitle: copy.offersSubtitle },
    { href: `/wallet/shops${q}`, emoji: '🏬', title: copy.shopsTitle, subtitle: copy.shopsSubtitle },
    { href: `/wallet/language${q}`, emoji: '🌐', title: copy.languageTitle, subtitle: copy.languageSubtitle },
  ]

  return (
    <main dir={dir} className="min-h-screen bg-[#FBFCFD] text-[#1a1a1a]">
      <WalletSiteHeader token={token} />

      <div className="mx-auto max-w-[720px] px-6 pt-10 pb-20 sm:px-8">
        <h1 className={`${ARCHIVO} mb-2 text-[28px] font-black leading-[1.05] tracking-[-0.01em] sm:text-[34px]`}>
          {copy.heading}
        </h1>
        <p className="mb-8 text-[15px] text-[#5a5a5a]">{copy.subheading}</p>

        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition-colors active:border-[#FF6B4A]/50 active:bg-[#FFF7F3]"
            >
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FFF7F3] text-2xl"
                aria-hidden="true"
              >
                {item.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-[#1a1a1a]">{item.title}</h2>
                <p className="text-sm text-neutral-500">{item.subtitle}</p>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
                className={`shrink-0 text-neutral-300 ${dir === 'rtl' ? 'scale-x-[-1]' : ''}`}
              >
                <path
                  d="M6 3.5L10.5 8L6 12.5"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          ))}
        </div>
      </div>
    </main>
  )
}
