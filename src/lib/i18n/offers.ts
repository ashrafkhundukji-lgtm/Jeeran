import type { Locale } from './locale'

// Fixed chrome text for the two public offer pages (src/app/offers/[campaignId]
// and src/app/offers/nearby) — the same three-locale system already used on
// the landing/dashboard pages (see landing.ts / dashboard.ts). Offer
// title/description, business name, and category are NOT covered here —
// business name/offer content is whatever the shop typed, in whatever
// language, same reasoning already established for the Wallet card text;
// category IS translated, but via the existing CATEGORY_LABELS map
// (src/lib/categories.ts), not duplicated here.
export interface OfferPageCopy {
  inactiveNotice: (businessName: string) => string
  howToRedeem: string
  redeemBody: (businessName: string) => string
  atBusiness: (businessName: string) => string
  getDirections: string
  whatsapp: string
  call: string
}

export const OFFER_PAGE_COPY: Record<Locale, OfferPageCopy> = {
  ar: {
    inactiveNotice: (businessName) =>
      `هذا العرض غير نشط حالياً — تحقق لاحقاً، أو تصفح ما يقدمه ${businessName} من عروض أخرى.`,
    howToRedeem: 'طريقة الاستخدام',
    redeemBody: (businessName) =>
      `أظهر بطاقة جيران لموظفي ${businessName} — بلا كوبون، بلا رمز، فقط البطاقة المحفوظة في محفظتك.`,
    atBusiness: (businessName) => `في ${businessName}`,
    getDirections: 'الاتجاهات',
    whatsapp: 'واتساب',
    call: 'اتصال',
  },
  en: {
    inactiveNotice: (businessName) =>
      `This offer isn't currently active — check back soon, or see what else ${businessName} has running.`,
    howToRedeem: 'How to redeem',
    redeemBody: (businessName) =>
      `Show your Jeeran pass to staff at ${businessName} — no coupon, no code, just the pass already saved to your wallet.`,
    atBusiness: (businessName) => `at ${businessName}`,
    getDirections: 'Get directions',
    whatsapp: 'WhatsApp',
    call: 'Call',
  },
  ur: {
    inactiveNotice: (businessName) =>
      `یہ آفر فی الحال فعال نہیں ہے — بعد میں دوبارہ چیک کریں، یا دیکھیں ${businessName} کے پاس اور کیا ہے۔`,
    howToRedeem: 'استعمال کا طریقہ',
    redeemBody: (businessName) =>
      `اپنا جیران پاس ${businessName} کے عملے کو دکھائیں — کوئی کوپن نہیں، کوئی کوڈ نہیں، بس آپ کے والٹ میں محفوظ پاس۔`,
    atBusiness: (businessName) => `${businessName} پر`,
    getDirections: 'راستہ دیکھیں',
    whatsapp: 'واٹس ایپ',
    call: 'کال کریں',
  },
}

export interface NearbyOffersCopy {
  heading: string
  subheading: string
  empty: string
  emptySearch: string
  searchPlaceholder: string
  viewOffer: string
  kmAway: (km: string) => string
  backToCategories: string
  offersCount: (n: number) => string
}

export const NEARBY_OFFERS_COPY: Record<Locale, NearbyOffersCopy> = {
  ar: {
    heading: 'عروض أخرى قريبة منك',
    subheading: 'المزيد من العروض من محلات قريبة منك، الآن.',
    empty: 'لا توجد عروض أخرى قريبة الآن — تحقق لاحقاً.',
    emptySearch: 'لا توجد نتائج مطابقة لبحثك.',
    searchPlaceholder: 'ابحث عن عرض أو محل أو فئة…',
    viewOffer: 'عرض التفاصيل',
    kmAway: (km) => `${km} كم`,
    backToCategories: 'الفئات',
    offersCount: (n) => `${n} عرض`,
  },
  en: {
    heading: 'Other offers nearby',
    subheading: 'More deals from shops near you, right now.',
    empty: 'No other offers nearby right now — check back later.',
    emptySearch: 'No offers match your search.',
    searchPlaceholder: 'Search offers, shops, or categories…',
    viewOffer: 'View offer',
    kmAway: (km) => `${km} km away`,
    backToCategories: 'Categories',
    offersCount: (n) => `${n} offer${n === 1 ? '' : 's'}`,
  },
  ur: {
    heading: 'قریب دیگر آفرز',
    subheading: 'آپ کے قریب دکانوں کی مزید پیشکشیں، ابھی۔',
    empty: 'اس وقت کوئی اور آفر قریب نہیں ہے — بعد میں دوبارہ چیک کریں۔',
    emptySearch: 'آپ کی تلاش سے کوئی آفر میل نہیں کھاتا۔',
    searchPlaceholder: 'آفرز، دکانیں، یا کیٹگری تلاش کریں…',
    viewOffer: 'آفر دیکھیں',
    kmAway: (km) => `${km} کلومیٹر دور`,
    backToCategories: 'کیٹگریز',
    offersCount: (n) => `${n} آفرز`,
  },
}
