'use client'

import { useEffect, useState } from 'react'
import { useLocale } from '@/lib/i18n/useLocale'
import { getDir } from '@/lib/i18n/locale'
import { WALLET_NAV_COPY } from '@/lib/i18n/walletNav'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import SiteLogo from '@/components/SiteLogo'
import BackButton from '@/components/BackButton'

// Shared top nav for every page a customer reaches by tapping a link on
// their Wallet card (an offer page, the nearby-offers/shops lists, the
// language picker) — previously each page rolled its own ad hoc header,
// which is exactly how an unlabeled, ALWAYS-visible back arrow ended up on
// pages that were genuinely dead ends (opened fresh from the Wallet app,
// nothing in this browser tab's history to actually go back to — a real
// customer flagged this directly). Two fixes live here once, instead of
// per-page:
//
//   1. Back only renders when document.referrer is actually THIS origin —
//      i.e. there's a real prior page in this tab's history to return to
//      (came from tapping a row in a list page), not just "some page from
//      the Wallet app exists somewhere." Checked client-side on mount,
//      since referrer isn't available to the server components that render
//      the rest of each page. history.back() then always lands somewhere
//      real, because we only offered it when that's true.
//   2. A permanent, labeled "Home" link (not just an icon-only button) to
//      /wallet/home — the actual "show me everything I can do" destination
//      that replaces the old ambiguous arrow as the default way out.
//
// `token` is optional: a page reachable WITHOUT one (a shared /offers/[id]
// link forwarded without its original ?token=, or an older Wallet pass link
// from before this existed) still gets Back-if-applicable, but skips Home
// and the logo's home-link entirely — there's no member to build one for.
export default function WalletSiteHeader({ token }: { token?: string }) {
  const [locale, setLocale] = useLocale()
  const dir = getDir(locale)
  const copy = WALLET_NAV_COPY[locale]
  const [showBack, setShowBack] = useState(false)

  useEffect(() => {
    try {
      setShowBack(!!document.referrer && new URL(document.referrer).origin === window.location.origin)
    } catch {
      setShowBack(false)
    }
  }, [])

  const homeHref = token ? `/wallet/home?token=${encodeURIComponent(token)}` : undefined

  return (
    <header className="mx-auto flex max-w-[720px] items-center justify-between px-6 pt-8 sm:px-8">
      <div className="flex items-center gap-3">
        {showBack && <BackButton dir={dir} label={copy.back} />}
        <SiteLogo className="h-12" href={homeHref ?? '/'} />
        {homeHref && (
          <a href={homeHref} className="text-sm font-medium text-neutral-500 transition-colors hover:text-[#1a1a1a]">
            {copy.home}
          </a>
        )}
      </div>
      <LanguageSwitcher locale={locale} onChange={setLocale} />
    </header>
  )
}
