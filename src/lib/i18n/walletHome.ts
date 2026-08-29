import type { Locale } from './locale'

// Fixed chrome for src/app/wallet/home (WalletHomeView) — the landing tab
// every wallet-linked page can reach via WalletTabBar. Mirrors what's
// actually on the customer's physical Wallet card (same top offer, same
// ranking — see the server page's own comment) rather than showing a
// second, possibly-different opinion about what's nearby.
export interface WalletHomeCopy {
  brand: string
  heading: string
  cardSectionLabel: string
  moreOnCard: (n: number) => string
  noOffersYet: string
  offersTitle: string
  offersSubtitle: string
  shopsTitle: string
  shopsSubtitle: string
}

export const WALLET_HOME_COPY: Record<Locale, WalletHomeCopy> = {
  ar: {
    brand: 'جيران',
    heading: 'مرحباً بك',
    cardSectionLabel: 'بطاقتك الآن',
    moreOnCard: (n) => `+${n} عروض أخرى على بطاقتك`,
    noOffersYet: 'لا توجد عروض على بطاقتك حالياً — تحقق لاحقاً.',
    offersTitle: 'العروض',
    offersSubtitle: 'قريبة منك',
    shopsTitle: 'المحلات',
    shopsSubtitle: 'قريبة منك',
  },
  en: {
    brand: 'Jeeran',
    heading: 'Welcome',
    cardSectionLabel: 'Your card right now',
    moreOnCard: (n) => `+${n} more on your card`,
    noOffersYet: "Nothing on your card right now — check back later.",
    offersTitle: 'Offers',
    offersSubtitle: 'nearby',
    shopsTitle: 'Shops',
    shopsSubtitle: 'nearby',
  },
  ur: {
    brand: 'جیران',
    heading: 'خوش آمدید',
    cardSectionLabel: 'آپ کا کارڈ ابھی',
    moreOnCard: (n) => `+${n} مزید آپ کے کارڈ پر`,
    noOffersYet: 'اس وقت آپ کے کارڈ پر کچھ نہیں ہے — بعد میں دوبارہ چیک کریں۔',
    offersTitle: 'آفرز',
    offersSubtitle: 'قریب',
    shopsTitle: 'دکانیں',
    shopsSubtitle: 'قریب',
  },
}
