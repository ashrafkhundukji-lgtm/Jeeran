'use client'

import Link from 'next/link'
import { LOCALES, type Locale } from '@/lib/i18n/locale'
import { LANDING_COPY } from '@/lib/i18n/landing'
import BrandLockup from '@/components/BrandLockup'

// The existing support line (same env var as the frozen-account page);
// no contact column at all when it isn't configured.
const SUPPORT_WHATSAPP = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP?.replace(/\D/g, '') || null

const FOCUS_DARK = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'

// Public-site footer (landing, /browse, /validate). `stickyBarClearance`
// adds room under it on phones for the landing page's fixed CTA bar.
export default function SiteFooter({
  locale,
  setLocale,
  stickyBarClearance = false,
}: {
  locale: Locale
  setLocale: (l: Locale) => void
  stickyBarClearance?: boolean
}) {
  const copy = LANDING_COPY[locale]
  const link = `flex min-h-11 items-center rounded text-brand-tint-2 hover:text-white ${FOCUS_DARK}`
  return (
    <footer
      className={`bg-brand-navy-deep px-[18px] pt-10 text-sm text-brand-tint-2 lg:px-10 ${stickyBarClearance ? 'pb-[108px] md:pb-7' : 'pb-7'}`}
    >
      <div className="mx-auto grid max-w-[1160px] gap-7 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="mb-2.5">
            <BrandLockup locale={locale} tone="dark" href={null} />
          </div>
          <p className="m-0 max-w-[28em] leading-[1.7]">{copy.footer.tagline}</p>
        </div>
        <div>
          <h2 className="mb-2 font-display text-sm font-semibold text-white">{copy.footer.product}</h2>
          <Link href="/browse" className={link}>
            {copy.nav.browse}
          </Link>
          <Link href="/signup" className={link}>
            {copy.footer.forShops}
          </Link>
          <Link href="/#customers" className={link}>
            {copy.nav.customers}
          </Link>
        </div>
        {SUPPORT_WHATSAPP && (
          <div>
            <h2 className="mb-2 font-display text-sm font-semibold text-white">{copy.footer.contact}</h2>
            <a href={`https://wa.me/${SUPPORT_WHATSAPP}`} target="_blank" rel="noopener noreferrer" className={link}>
              {copy.footer.whatsapp}
            </a>
          </div>
        )}
        <div>
          <h2 className="mb-2 font-display text-sm font-semibold text-white">{copy.footer.language}</h2>
          {LOCALES.map((l) => (
            <button
              key={l.code}
              type="button"
              lang={l.code}
              onClick={() => setLocale(l.code)}
              aria-current={l.code === locale ? 'true' : undefined}
              className={`${link} ${l.code === locale ? 'font-semibold text-white' : ''}`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
      <p className="mx-auto mt-7 max-w-[1160px] border-t border-white/14 pt-4 text-xs text-brand-tint-2/90">
        © {new Date().getFullYear()} {copy.footer.rights}
      </p>
    </footer>
  )
}
