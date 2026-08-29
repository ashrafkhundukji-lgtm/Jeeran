import type { Locale } from './locale'

// Fixed chrome text for src/app/wallet/shops (NearbyShopsView) — same
// three-locale system as offers.ts's NEARBY_OFFERS_COPY, which this
// deliberately mirrors closely (same page shape: search + category grid +
// drill-down list), just for shops generally rather than only ones with an
// active offer right now.
export interface NearbyShopsCopy {
  heading: string
  subheading: string
  empty: string
  emptySearch: string
  searchPlaceholder: string
  viewOffer: string
  getDirections: string
  hasOffer: string
  kmAway: (km: string) => string
  backToCategories: string
  shopsCount: (n: number) => string
  back: string
}

export const NEARBY_SHOPS_COPY: Record<Locale, NearbyShopsCopy> = {
  ar: {
    heading: 'محلات قريبة منك',
    subheading: 'كل محلات جيران حولك الآن، بعرض أو بدون.',
    empty: 'لا توجد محلات قريبة منك حالياً.',
    emptySearch: 'لا توجد نتائج مطابقة لبحثك.',
    searchPlaceholder: 'ابحث عن محل أو فئة…',
    viewOffer: 'عرض العرض',
    getDirections: 'الاتجاهات',
    hasOffer: 'يوجد عرض',
    kmAway: (km) => `${km} كم`,
    backToCategories: 'الفئات',
    shopsCount: (n) => `${n} محل`,
    back: 'رجوع',
  },
  en: {
    heading: 'Shops near you',
    subheading: 'Every Jeeran shop around you right now, offer or not.',
    empty: 'No shops nearby right now.',
    emptySearch: 'No shops match your search.',
    searchPlaceholder: 'Search shops or categories…',
    viewOffer: 'View offer',
    getDirections: 'Get directions',
    hasOffer: 'Has an offer',
    kmAway: (km) => `${km} km away`,
    backToCategories: 'Categories',
    shopsCount: (n) => `${n} shop${n === 1 ? '' : 's'}`,
    back: 'Back',
  },
  ur: {
    heading: 'آپ کے قریب دکانیں',
    subheading: 'آپ کے ارد گرد ہر جیران دکان، آفر ہو یا نہ ہو۔',
    empty: 'اس وقت قریب کوئی دکان نہیں ہے۔',
    emptySearch: 'آپ کی تلاش سے کوئی دکان میل نہیں کھاتی۔',
    searchPlaceholder: 'دکانیں یا کیٹگری تلاش کریں…',
    viewOffer: 'آفر دیکھیں',
    getDirections: 'راستہ دیکھیں',
    hasOffer: 'آفر موجود ہے',
    kmAway: (km) => `${km} کلومیٹر دور`,
    backToCategories: 'کیٹگریز',
    shopsCount: (n) => `${n} دکانیں`,
    back: 'واپس',
  },
}
