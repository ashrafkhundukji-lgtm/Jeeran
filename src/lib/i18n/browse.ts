import type { Locale } from './locale'

export interface BrowseCopy {
  title: string
  subtitle: string
  backToCategories: string
  categorySubtitle: string
  noShops: string
}

export const BROWSE_COPY: Record<Locale, BrowseCopy> = {
  ar: {
    title: 'تصفح المحلات',
    subtitle: 'اختر فئة لرؤية المحلات القريبة منك.',
    backToCategories: 'كل الفئات',
    categorySubtitle: 'تظهر المحلات الأكثر ترويجًا أولاً.',
    noShops: 'لا توجد محلات في هذه الفئة بعد.',
  },
  en: {
    title: 'Browse shops',
    subtitle: 'Pick a category to see shops near you.',
    backToCategories: 'All categories',
    categorySubtitle: 'Top-promoted shops appear first.',
    noShops: 'No shops in this category yet.',
  },
  ur: {
    title: 'دکانیں براؤز کریں',
    subtitle: 'اپنے قریب دکانیں دیکھنے کے لیے ایک کیٹیگری منتخب کریں۔',
    backToCategories: 'تمام کیٹیگریز',
    categorySubtitle: 'سب سے زیادہ فروغ یافتہ دکانیں پہلے دکھائی جاتی ہیں۔',
    noShops: 'اس کیٹیگری میں ابھی تک کوئی دکان نہیں ہے۔',
  },
}
