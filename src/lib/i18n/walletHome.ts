import type { Locale } from './locale'

// Fixed chrome for src/app/wallet/home (WalletHomeView) — the hub every
// "Home" link in WalletSiteHeader points to. One menu row per destination a
// customer can reach from their Wallet card.
export interface WalletHomeCopy {
  heading: string
  subheading: string
  offersTitle: string
  offersSubtitle: string
  shopsTitle: string
  shopsSubtitle: string
  languageTitle: string
  languageSubtitle: string
}

export const WALLET_HOME_COPY: Record<Locale, WalletHomeCopy> = {
  ar: {
    heading: 'مرحباً بك',
    subheading: 'كل ما يمكنك فعله من بطاقة جيران الخاصة بك.',
    offersTitle: 'عروض قريبة منك',
    offersSubtitle: 'تصفح العروض المتاحة حولك الآن.',
    shopsTitle: 'محلات قريبة منك',
    shopsSubtitle: 'كل المحلات حولك، بعرض أو بدون.',
    languageTitle: 'لغة البطاقة',
    languageSubtitle: 'اختر لغة عرض بطاقتك في المحفظة.',
  },
  en: {
    heading: 'Welcome',
    subheading: 'Everything you can do from your Jeeran pass.',
    offersTitle: 'Offers near you',
    offersSubtitle: 'Browse what shops nearby are offering right now.',
    shopsTitle: 'Shops near you',
    shopsSubtitle: 'Every shop around you, offer or not.',
    languageTitle: 'Card language',
    languageSubtitle: 'Choose which language your Wallet card shows.',
  },
  ur: {
    heading: 'خوش آمدید',
    subheading: 'آپ کے جیران پاس سے آپ جو کچھ کر سکتے ہیں۔',
    offersTitle: 'آپ کے قریب آفرز',
    offersSubtitle: 'ابھی اپنے قریب دکانوں کی پیشکشیں دیکھیں۔',
    shopsTitle: 'آپ کے قریب دکانیں',
    shopsSubtitle: 'آپ کے ارد گرد ہر دکان، آفر ہو یا نہ ہو۔',
    languageTitle: 'کارڈ کی زبان',
    languageSubtitle: 'اپنے والٹ کارڈ کی زبان منتخب کریں۔',
  },
}
