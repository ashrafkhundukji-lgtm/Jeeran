'use client'

import { useLocale } from '@/lib/i18n/useLocale'
import { WALLET_TAB_BAR_COPY } from '@/lib/i18n/walletTabBar'
import { GlobeIcon, HomeIcon, StoreIcon, TagIcon } from './icons'

export type NavKey = 'home' | 'offers' | 'shops' | 'language'

// Persistent bottom nav for every wallet-linked page (Home, Offers, Shops,
// Language). Replaces WalletTabBar's floating keycaps: that bar was
// transparent between buttons, so list text showed through underneath.
// This one is a solid white bar with a hairline top border; the active
// item is navy with a short coral bar on the top edge. Pages reserve
// NAV_CLEARANCE at the bottom so nothing ever sits under it.
//
// Plain <a> tags, not next/link: every hop between these pages is a full
// navigation (each page does its own server-side fetch keyed off the
// token) — same convention as before.
export const NAV_CLEARANCE = 'pb-[calc(100px+env(safe-area-inset-bottom,0px))]'

export default function BottomNav({ token, active }: { token: string; active: NavKey }) {
  const [locale] = useLocale()
  const copy = WALLET_TAB_BAR_COPY[locale]
  const q = `?token=${encodeURIComponent(token)}`

  const items: { key: NavKey; href: string; label: string; Icon: typeof HomeIcon }[] = [
    { key: 'home', href: `/wallet/home${q}`, label: copy.home, Icon: HomeIcon },
    { key: 'offers', href: `/offers/nearby${q}`, label: copy.offers, Icon: TagIcon },
    { key: 'shops', href: `/wallet/shops${q}`, label: copy.shops, Icon: StoreIcon },
    { key: 'language', href: `/wallet/language${q}`, label: copy.language, Icon: GlobeIcon },
  ]

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-brand-line bg-white font-body"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="mx-auto flex h-[84px] max-w-md px-3 pt-2 pb-3.5">
        {items.map(({ key, href, label, Icon }) => {
          const isActive = key === active
          return (
            <a
              key={key}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex min-h-[44px] flex-1 flex-col items-center justify-center gap-1 text-xs transition-colors ${
                isActive ? 'font-bold text-brand-navy' : 'font-semibold text-brand-muted active:text-brand-navy'
              }`}
            >
              {isActive && <span aria-hidden="true" className="absolute -top-2 h-1 w-7 rounded-b bg-brand-coral-brand" />}
              <Icon size={24} />
              <span>{label}</span>
            </a>
          )
        })}
      </div>
    </nav>
  )
}
