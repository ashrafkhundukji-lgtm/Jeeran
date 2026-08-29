'use client'

import { useLocale } from '@/lib/i18n/useLocale'
import { getDir } from '@/lib/i18n/locale'
import { WALLET_HOME_COPY } from '@/lib/i18n/walletHome'
import WalletTabBar from '@/components/WalletTabBar'
import type { NearbyOffer } from '@/lib/wallet/google-membership-pass'

const ARCHIVO = 'font-[family-name:var(--font-archivo)]'

// The Home tab — what WalletTabBar's "Home" item always lands on. Shows the
// SAME top offer currently on the customer's physical Wallet card (the
// server page resolves it via the identical nearby_active_offers() ranking
// offersToTextModules uses), so this reads as "your card, in the browser,"
// not a second opinion about what's nearby. Below that, two shortcuts to
// the full Offers/Shops tabs — a home dashboard having both a tab bar AND
// its own shortcuts is a standard, common mobile pattern, not a duplicate.
export default function WalletHomeView({
  token,
  topOffer,
  otherCount,
}: {
  token: string
  topOffer: NearbyOffer | null
  otherCount: number
}) {
  const [locale] = useLocale()
  const dir = getDir(locale)
  const copy = WALLET_HOME_COPY[locale]
  const q = `?token=${encodeURIComponent(token)}`

  return (
    <main dir={dir} className="min-h-screen bg-[#FBFCFD] pb-24 text-[#1a1a1a]">
      <div className="mx-auto max-w-[480px] px-6 pt-10">
        <div className="mb-1 text-xs font-semibold tracking-wide text-[#FF6B4A] uppercase">{copy.brand}</div>
        <h1 className={`${ARCHIVO} mb-6 text-[30px] font-black leading-[1.05] tracking-[-0.01em]`}>{copy.heading}</h1>

        <div className="mb-3 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
          {copy.cardSectionLabel}
        </div>

        {topOffer ? (
          <a
            href={`/offers/${topOffer.offer_id}${q}`}
            className="mb-8 block rounded-[20px] bg-gradient-to-br from-[#1E3A8A] to-[#3B5BC4] p-5 text-white shadow-[0_12px_24px_-12px_rgba(30,58,138,0.5)] transition-transform active:scale-[0.99]"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wide text-white/75 uppercase">Jeeran Offers</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="1" y="4" width="22" height="16" rx="2" />
                <path d="M1 10h22" />
              </svg>
            </div>
            <div className="mb-0.5 text-[13px] text-white/70">{topOffer.business_name}</div>
            <div className={`${ARCHIVO} mb-2.5 text-[19px] font-bold leading-tight`}>{topOffer.offer_title}</div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-white/85">{topOffer.distance_km.toFixed(1)} km</span>
              {otherCount > 0 && <span className="text-xs text-white/65">{copy.moreOnCard(otherCount)}</span>}
            </div>
          </a>
        ) : (
          <p className="mb-8 text-sm text-neutral-500">{copy.noOffersYet}</p>
        )}

        <div className="flex gap-3">
          <a
            href={`/offers/nearby${q}`}
            className="flex flex-1 flex-col gap-2.5 rounded-[18px] border border-neutral-200 bg-white p-4 transition-colors active:border-[#FF6B4A]/50 active:bg-[#FFF7F3]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF7F3]" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF6B4A" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41 12 22 2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82Z" />
                <circle cx="7" cy="7" r="1.4" fill="#FF6B4A" stroke="none" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-semibold">{copy.offersTitle}</div>
              <div className="text-xs text-neutral-500">{copy.offersSubtitle}</div>
            </div>
          </a>
          <a
            href={`/wallet/shops${q}`}
            className="flex flex-1 flex-col gap-2.5 rounded-[18px] border border-neutral-200 bg-white p-4 transition-colors active:border-[#FF6B4A]/50 active:bg-[#FFF7F3]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF7F3]" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF6B4A" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 9l1-5h14l1 5" />
                <path d="M4 9a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0" />
                <path d="M5 9v10h14V9" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-semibold">{copy.shopsTitle}</div>
              <div className="text-xs text-neutral-500">{copy.shopsSubtitle}</div>
            </div>
          </a>
        </div>
      </div>

      <WalletTabBar token={token} active="home" />
    </main>
  )
}
