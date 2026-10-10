'use client'

import { useLocale } from '@/lib/i18n/useLocale'
import { getDir } from '@/lib/i18n/locale'
import { displayFont } from '@/lib/i18n/displayFont'
import { WALLET_HOME_COPY } from '@/lib/i18n/walletHome'
import WalletTabBar from '@/components/WalletTabBar'
import WalletAppBar from '@/components/WalletAppBar'
import type { NearbyOffer } from '@/lib/wallet/google-membership-pass'

const ARCHIVO = 'font-[family-name:var(--font-baloo)]'

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
    <main dir={dir} className="min-h-screen bg-[#FFF8EC] pb-24 text-[#2E1065]">
      <WalletAppBar token={token} />
      <div className="mx-auto max-w-[480px] px-6 pt-6">
        <h1 className={`${displayFont(locale)} mb-5 text-[30px] font-black leading-[1.05] tracking-[-0.01em]`}>{copy.heading}</h1>

        {/* Plain GET form, not a client-side search: submitting lands on the
            Shops tab with ?q= filled in, and that page's own search box
            (NearbyShopsView) does the actual searching — including shops
            beyond the member's radius. One search implementation, two
            entry points. */}
        <form action="/wallet/shops" method="get" role="search" className="relative mb-6">
          <input type="hidden" name="token" value={token} />
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
            className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-[#8A76BE] ${dir === 'rtl' ? 'right-4' : 'left-4'}`}
          >
            <circle cx="7" cy="7" r="5.25" stroke="currentColor" strokeWidth="1.5" />
            <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            name="q"
            enterKeyHint="search"
            required
            minLength={2}
            placeholder={copy.searchPlaceholder}
            aria-label={copy.searchPlaceholder}
            className={`w-full rounded-2xl border border-[#EDE3F7] bg-white py-3.5 text-[15px] text-[#2E1065] shadow-sm placeholder:text-[#8A76BE] focus:border-[#FF5A79]/50 focus:outline-none ${dir === 'rtl' ? 'pr-11 pl-4' : 'pl-11 pr-4'}`}
          />
        </form>

        <div className="mb-3 text-xs font-semibold tracking-wide text-[#8A76BE] uppercase">
          {copy.cardSectionLabel}
        </div>

        {topOffer ? (
          <a
            href={`/offers/${topOffer.offer_id}${q}`}
            className="mb-8 block rounded-[20px] bg-gradient-to-br from-[#2E1065] to-[#4C2A98] p-5 text-white shadow-[0_12px_24px_-12px_rgba(46,16,101,0.5)] transition-transform active:scale-[0.99]"
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
          <p className="mb-8 text-sm text-[#8A76BE]">{copy.noOffersYet}</p>
        )}

        <div className="flex gap-3">
          <a
            href={`/offers/nearby${q}`}
            className="flex flex-1 flex-col gap-2.5 rounded-[20px] border border-[#EDE3F7] bg-white p-4 transition-colors active:border-[#FF5A79]/50 active:bg-[#FFE3E8]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFE3E8]" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF5A79" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41 12 22 2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82Z" />
                <circle cx="7" cy="7" r="1.4" fill="#FF5A79" stroke="none" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-semibold">{copy.offersTitle}</div>
              <div className="text-xs text-[#8A76BE]">{copy.offersSubtitle}</div>
            </div>
          </a>
          <a
            href={`/wallet/shops${q}`}
            className="flex flex-1 flex-col gap-2.5 rounded-[20px] border border-[#EDE3F7] bg-white p-4 transition-colors active:border-[#FF5A79]/50 active:bg-[#FFE3E8]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFE3E8]" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF5A79" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 9l1-5h14l1 5" />
                <path d="M4 9a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0" />
                <path d="M5 9v10h14V9" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-semibold">{copy.shopsTitle}</div>
              <div className="text-xs text-[#8A76BE]">{copy.shopsSubtitle}</div>
            </div>
          </a>
        </div>
      </div>

      <WalletTabBar token={token} active="home" />
    </main>
  )
}
