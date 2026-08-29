'use client'

import { useLocale } from '@/lib/i18n/useLocale'
import { WALLET_TAB_BAR_COPY } from '@/lib/i18n/walletTabBar'

const ORANGE = '#FF6B4A'
const TERTIARY = '#9ca3af'

// Fixed bottom nav shared by every top-level wallet page (Home, Offers,
// Shops, Language) — replaces the old top header (logo + labeled "Home" +
// a referrer-conditional Back button). A real customer flagged that
// arrangement as confusing and asked for the site to feel like a mobile
// app instead; a persistent, always-identical bottom tab bar is the actual
// mobile-app answer — see the design mockup this was built from. The offer
// detail page (a genuine drill-in from any of these four, not a
// destination of its own) deliberately has NO tab bar — see its own
// floating back button instead.
//
// Plain <a> tags, not next/link: every hop between these pages is meant to
// be a full navigation (same convention already used everywhere else in
// this mini-site), and each page already does its own server-side data
// fetch keyed off the token in the URL.
export default function WalletTabBar({
  token,
  active,
}: {
  token: string
  active: 'home' | 'offers' | 'shops' | 'language'
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
    <nav
      className="fixed inset-x-0 bottom-0 z-20 flex border-t border-neutral-200 bg-white"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {items.map((item) => {
        const isActive = item.key === active
        const color = isActive ? ORANGE : TERTIARY
        return (
          <a
            key={item.key}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            className="flex flex-1 flex-col items-center gap-1 py-2.5"
            style={{ color }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={isActive ? 1.9 : 1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {item.icon}
            </svg>
            <span className="text-[11px]" style={{ fontWeight: isActive ? 600 : 500 }}>
              {item.label}
            </span>
          </a>
        )
      })}
    </nav>
  )
}
