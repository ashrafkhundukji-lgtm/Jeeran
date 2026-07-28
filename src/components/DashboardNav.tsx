'use client'

import { usePathname } from 'next/navigation'
import SiteLogo from '@/components/SiteLogo'
import SignOutButton from '@/components/SignOutButton'
import { useLocale } from '@/lib/i18n/useLocale'
import { getDir } from '@/lib/i18n/locale'
import { DASHBOARD_COPY } from '@/lib/i18n/dashboard'

export default function DashboardNav() {
  const pathname = usePathname()
  const [locale] = useLocale()
  const dir = getDir(locale)
  const copy = DASHBOARD_COPY[locale]

  const navLinks = [
    { href: '/dashboard/owner', label: copy.nav.dashboard },
    { href: '/dashboard/billing', label: copy.nav.billing },
    { href: '/dashboard/profile', label: copy.nav.profile },
  ]

  return (
    <div dir={dir} className="flex flex-wrap items-center justify-between gap-y-3 pb-6 mb-6 border-b border-neutral-200">
      <SiteLogo className="h-12 sm:h-20" />
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        <nav className="flex items-center gap-1 bg-neutral-100 rounded-lg p-1">
          {navLinks.map((link) => {
            const active = pathname === link.href
            return (
              <a
                key={link.href}
                href={link.href}
                className={`text-sm font-medium rounded-md px-2.5 sm:px-3 py-1.5 transition-colors ${
                  active ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
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
  )
}
