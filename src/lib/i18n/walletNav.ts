import type { Locale } from './locale'

// Single source for the shared nav (WalletSiteHeader.tsx) used across every
// page reachable from the Wallet card — replaces each page previously
// carrying its own copy of "back" (offers.ts's OFFER_PAGE_COPY.back,
// NEARBY_OFFERS_COPY.back, etc.), which is how they drifted into
// inconsistent header behavior in the first place.
export interface WalletNavCopy {
  home: string
  back: string
}

export const WALLET_NAV_COPY: Record<Locale, WalletNavCopy> = {
  ar: { home: 'الرئيسية', back: 'رجوع' },
  en: { home: 'Home', back: 'Back' },
  ur: { home: 'ہوم', back: 'واپس' },
}
