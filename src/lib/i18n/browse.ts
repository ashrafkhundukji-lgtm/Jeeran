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
}

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
  },
}
