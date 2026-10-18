'use client'

import type { Locale } from '@/lib/i18n/locale'
import { LANDING_COPY } from '@/lib/i18n/landing'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import BrandLockup from '@/components/BrandLockup'

// Public-site header (landing, /browse, /validate): logo, links, language
// switcher. `tone="dark"` sits over the landing hero photo (white,
// absolutely positioned); `tone="light"` is the cream-page version.
export default function SiteHeader({
  locale,
  setLocale,
  tone = 'light',
  current,
}: {
  locale: Locale
  setLocale: (l: Locale) => void
  tone?: 'light' | 'dark'
  current?: 'browse'
}) {
  const copy = LANDING_COPY[locale]
  const dark = tone === 'dark'
  const focus = dark
    ? 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'
    : 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-navy'
  const link = `flex min-h-11 items-center rounded-lg px-3 text-sm font-medium ${focus} ${
    dark ? 'text-white/90 hover:text-white' : 'text-brand-muted hover:text-brand-navy-deep'
  }`
  const links = [
    { href: '/browse', label: copy.nav.browse, key: 'browse' },
    { href: '/#customers', label: copy.nav.customers, key: 'customers' },
    { href: '/login', label: copy.nav.login, key: 'login' },
  ]

  return (
    <header className={dark ? 'absolute inset-x-0 top-0 z-20' : 'relative z-20 border-b border-brand-line bg-brand-cream'}>
      <div className="mx-auto flex max-w-[1240px] items-center gap-3 px-[18px] py-3.5 lg:px-10 lg:py-4">
        <BrandLockup locale={locale} tone={dark ? 'dark' : 'light'} />
        <nav aria-label={copy.brand} className="ms-auto hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <a
              key={l.key}
              href={l.href}
              aria-current={current === l.key ? 'page' : undefined}
              className={`${link} ${current === l.key ? (dark ? 'text-white' : 'font-semibold text-brand-navy-deep') : ''}`}
            >
              {l.label}
            </a>
          ))}
        </nav>
        <a href="/login" className={`ms-auto flex min-h-11 items-center rounded-lg px-2 text-sm font-semibold md:hidden ${focus} ${dark ? '' : 'text-brand-navy-deep'}`}>
          {copy.nav.loginShort}
        </a>
        <div className="md:hidden">
          <LanguageSwitcher locale={locale} onChange={setLocale} tone={tone} compact />
        </div>
        <div className="hidden md:block">
          <LanguageSwitcher locale={locale} onChange={setLocale} tone={tone} />
        </div>
      </div>
    </header>
  )
}
