import type { Locale } from './locale'

// Mirrors NEARBY_SHOPS_COPY (src/lib/i18n/nearbyShops.ts) closely — same
// page shape (search + category chip row + a single flat list) now that
// /browse replaced its old category-grid-then-drill-down flow. No kmAway
// here: unlike the wallet's shop list, this page has no known visitor
// location, so rows show a promotion tier badge instead of a distance.
export interface BrowseCopy {
  title: string
  subtitle: string
  empty: string
  emptySearch: string
  searchPlaceholder: string
  viewOffer: string
  getDirections: string
  hasOffer: string
  allCategories: string
  // Live result count under the search field (announced via aria-live).
  resultCount: (n: number) => string
}

// Plural-aware count: Arabic has zero/one/two/few/many/other forms.
const AR_PLURAL = new Intl.PluralRules('ar')
const EN_PLURAL = new Intl.PluralRules('en')
const UR_PLURAL = new Intl.PluralRules('ur')

export const BROWSE_COPY: Record<Locale, BrowseCopy> = {
  ar: {
    title: 'تصفح المحلات',
    subtitle: 'كل محلات جيران، بعرض أو بدون.',
    empty: 'لا توجد محلات بعد.',
    emptySearch: 'لا توجد نتائج مطابقة لبحثك.',
    searchPlaceholder: 'ابحث عن محل أو فئة…',
    viewOffer: 'عرض العرض',
    getDirections: 'الاتجاهات',
    hasOffer: 'يوجد عرض',
    allCategories: 'الكل',
    resultCount: (n) =>
      ({
        zero: 'لا توجد محلات',
        one: 'محل واحد',
        two: 'محلّان',
        few: `${n} محلات`,
        many: `${n} محلًا`,
        other: `${n} محل`,
      })[AR_PLURAL.select(n)] ?? `${n} محل`,
  },
  en: {
    title: 'Browse shops',
    subtitle: 'Every Jeeran shop, offer or not.',
    empty: 'No shops yet.',
    emptySearch: 'No shops match your search.',
    searchPlaceholder: 'Search shops or categories…',
    viewOffer: 'View offer',
    getDirections: 'Get directions',
    hasOffer: 'Has an offer',
    allCategories: 'All',
    resultCount: (n) => (EN_PLURAL.select(n) === 'one' ? '1 shop' : `${n} shops`),
  },
  ur: {
    title: 'دکانیں براؤز کریں',
    subtitle: 'ہر جیران دکان، آفر ہو یا نہ ہو۔',
    empty: 'ابھی تک کوئی دکان نہیں ہے۔',
    emptySearch: 'آپ کی تلاش سے کوئی دکان میل نہیں کھاتی۔',
    searchPlaceholder: 'دکانیں یا کیٹگری تلاش کریں…',
    viewOffer: 'آفر دیکھیں',
    getDirections: 'راستہ دیکھیں',
    hasOffer: 'آفر موجود ہے',
    allCategories: 'تمام',
    resultCount: (n) => (UR_PLURAL.select(n) === 'one' ? '1 دکان' : `${n} دکانیں`),
  },
}
