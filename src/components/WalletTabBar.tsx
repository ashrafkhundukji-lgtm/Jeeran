'use client'

import { useLocale } from '@/lib/i18n/useLocale'
import { WALLET_TAB_BAR_COPY } from '@/lib/i18n/walletTabBar'

const ACTIVE_ICON = '#FFC93C'
const TERTIARY = '#C6B8E8'

// Fixed bottom nav shared by every wallet-linked page (Home, Offers, Shops,
// Language, and now the offer detail drill-in) — replaces the old top
// header (logo + labeled "Home" + a referrer-conditional Back button). A
// real customer flagged that arrangement as confusing and asked for the
// site to feel like a mobile app instead; a persistent, always-identical
// bottom tab bar is the actual mobile-app answer — see the design mockup
// this was built from. A second real customer then got stuck on the offer
// detail page specifically (a Google Wallet "View offer" tap goes straight
// there, often with no in-app history to fall back on) because it was the
// one screen with no way back to the rest of the site — see OfferPageView's
// own header comment. `children`, rendered above the pill nav inside the
// same fixed/safe-area-aware wrapper, is how that page adds its
// Directions/WhatsApp/Call row without a second competing fixed footer.
//
// Plain <a> tags, not next/link: every hop between these pages is meant to
// be a full navigation (same convention already used everywhere else in
// this mini-site), and each page already does its own server-side data
// fetch keyed off the token in the URL.
export default function WalletTabBar({
  token,
  active,
  children,
}: {
  token: string
  active: 'home' | 'offers' | 'shops' | 'language'
  children?: React.ReactNode
}) {
  const [locale] = useLocale()
  const copy = WALLET_TAB_BAR_COPY[locale]
  const q = `?token=${encodeURIComponent(token)}`

  const items: { key: typeof active; href: string; label: string; icon: React.ReactNode }[] = [
    {
      key: 'home',
      href: `/wallet/home${q}`,
      label: copy.home,
      icon: (
        <path d="M3 10.5 12 4l9 6.5V19a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10.5Z" />
      ),
    },
    {
      key: 'offers',
      href: `/offers/nearby${q}`,
      label: copy.offers,
      icon: (
        <>
          <path d="M20.59 13.41 12 22 2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82Z" />
          <circle cx="7" cy="7" r="1.4" fill="currentColor" stroke="none" />
        </>
      ),
    },
    {
      key: 'shops',
      href: `/wallet/shops${q}`,
      label: copy.shops,
      icon: (
        <>
          <path d="M4 9l1-5h14l1 5" />
          <path d="M4 9a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0" />
          <path d="M5 9v10h14V9" />
        </>
      ),
    },
    {
      key: 'language',
      href: `/wallet/language${q}`,
      label: copy.language,
      icon: (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18" />
        </>
      ),
    },
  ]

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-20 px-4"
      style={{ paddingBottom: 'calc(14px + env(safe-area-inset-bottom, 0px))' }}
    >
      {children && <div className="mx-auto mb-2 max-w-[420px]">{children}</div>}
      <nav className="mx-auto flex max-w-[420px] items-center justify-around rounded-full bg-white p-1.5 shadow-[0_10px_26px_-14px_rgba(46,16,101,0.45)]">
        {items.map((item) => {
          const isActive = item.key === active
          return (
            <a
              key={item.key}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className="flex flex-1 flex-col items-center gap-1 py-1.5"
            >
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full"
                style={{ backgroundColor: isActive ? '#2E1065' : 'transparent' }}
              >
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={isActive ? ACTIVE_ICON : TERTIARY}
                  strokeWidth={isActive ? 2 : 1.75}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  {item.icon}
                </svg>
              </span>
              <span
                className="text-[10px]"
                style={{ color: isActive ? '#2E1065' : TERTIARY, fontWeight: isActive ? 700 : 500 }}
              >
                {item.label}
              </span>
            </a>
          )
        })}
      </nav>
    </div>
  )
}
