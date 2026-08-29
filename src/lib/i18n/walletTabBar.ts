import type { Locale } from './locale'

// Labels for WalletTabBar.tsx's four destinations — replaces the old
// WalletSiteHeader (top logo + labeled "Home" link + referrer-conditional
// Back) across every wallet-linked page. A bottom tab bar makes that whole
// conditional-Back problem moot: these four destinations are always
// reachable, always in the same place, so there's nothing to hide/show
// based on document.referrer anymore. The one screen that still needs a
// real Back is the offer detail page (a genuine drill-in, not a top-level
// destination) — see OfferPageView.tsx's own floating back button.
export interface WalletTabBarCopy {
  home: string
  offers: string
  shops: string
  language: string
}

export const WALLET_TAB_BAR_COPY: Record<Locale, WalletTabBarCopy> = {
  ar: { home: 'الرئيسية', offers: 'العروض', shops: 'المحلات', language: 'اللغة' },
  en: { home: 'Home', offers: 'Offers', shops: 'Shops', language: 'Language' },
  ur: { home: 'ہوم', offers: 'آفرز', shops: 'دکانیں', language: 'زبان' },
}
