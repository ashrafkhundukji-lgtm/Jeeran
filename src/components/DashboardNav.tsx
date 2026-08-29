'use client'

import { usePathname } from 'next/navigation'
import SiteLogo from '@/components/SiteLogo'
import SignOutButton from '@/components/SignOutButton'
import { useLocale } from '@/lib/i18n/useLocale'
import { getDir } from '@/lib/i18n/locale'
import { DASHBOARD_COPY } from '@/lib/i18n/dashboard'

const ORANGE = '#FF6B4A'
const TERTIARY = '#9ca3af'

// house / scan-corners / credit-card / user — same icon set (and the same
// "active tab colored orange, rest tertiary gray" convention) as
// WalletTabBar.tsx on the customer side, so the two sides of this app read
// as one product on mobile.
const ICONS: Record<string, React.ReactNode> = {
  dashboard: <path d="M3 10.5 12 4l9 6.5V19a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10.5Z" />,
  redeem: (
    <>
      <path d="M4 8V5a1 1 0 0 1 1-1h3M20 8V5a1 1 0 0 0-1-1h-3M4 16v3a1 1 0 0 0 1 1h3M20 16v3a1 1 0 0 1-1 1h-3" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
    </>
  ),
  billing: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
    </>
  ),
}

export default function DashboardNav() {
  const pathname = usePathname()
  const [locale] = useLocale()
  const dir = getDir(locale)
  const copy = DASHBOARD_COPY[locale]

  const navLinks = [
    { key: 'dashboard', href: '/dashboard/owner', label: copy.nav.dashboard },
    { key: 'redeem', href: '/dashboard/redeem', label: copy.nav.redeem },
    { key: 'billing', href: '/dashboard/billing', label: copy.nav.billing },
    { key: 'profile', href: '/dashboard/profile', label: copy.nav.profile },
  ]

  return (
    <>
      {/* Desktop (md and up) — unchanged pill nav. */}
      <div
        dir={dir}
        className="hidden md:flex flex-wrap items-center justify-between gap-y-3 pb-6 mb-6 border-b border-neutral-200"
      >
        <SiteLogo className="h-14 sm:h-16" />
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <nav className="flex items-center gap-1 bg-[#1E3A8A]/5 rounded-lg p-1">
            {navLinks.map((link) => {
              const active = pathname === link.href
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium rounded-md px-2.5 sm:px-3 py-1.5 transition-colors ${
                    active ? 'bg-[#1E3A8A] text-white shadow-sm' : 'text-[#5a5a5a] hover:text-[#1a1a1a]'
                  }`}
                >
                  {link.label}
                </a>
              )
            })}
          </nav>
          <div className="w-px h-5 bg-neutral-200" />
          <SignOutButton />
        </div>
      </div>

      {/* Mobile (<768px) — bottom tab bar, same pattern as the customer
          side's WalletTabBar. Fixed positioning means it renders correctly
          regardless of where in the page DashboardNav is mounted; each
          dashboard page adds bottom padding to its own content so nothing
          sits underneath it — see e.g. OwnerDashboardView.tsx. */}
      <nav
        dir={dir}
        className="md:hidden fixed inset-x-0 bottom-0 z-20 flex border-t border-neutral-200 bg-white"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {navLinks.map((link) => {
          const active = pathname === link.href
          const color = active ? ORANGE : TERTIARY
          return (
            <a
              key={link.href}
              href={link.href}
              aria-current={active ? 'page' : undefined}
              className="flex flex-1 flex-col items-center gap-1 py-2.5"
              style={{ color }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={active ? 1.9 : 1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                {ICONS[link.key]}
              </svg>
              <span className="text-[11px]" style={{ fontWeight: active ? 600 : 500 }}>
                {link.label}
              </span>
            </a>
          )
        })}
      </nav>
    </>
  )
}
