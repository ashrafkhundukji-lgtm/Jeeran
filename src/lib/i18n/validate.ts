import type { Locale } from './locale'

// /validate (staff confirm a legacy per-offer wallet coupon). Previously
// hardcoded English with one Arabic line; same strings, now in all three
// languages. Server error text (body.error from /api/validate) is shown
// as-is under `invalidTitle`, as before.
export interface ValidateCopy {
  title: string
  body: string
  confirm: string
  checking: string
  missingLink: string
  validTitle: string
  invalidTitle: string
  fallbackError: string
}

export const VALIDATE_COPY: Record<Locale, ValidateCopy> = {
  ar: {
    title: 'تأكيد القسيمة',
    body: 'أكّد قسيمة المحفظة الخاصة بهذا العميل لتسجيلها كمستردّة.',
    confirm: 'تأكيد الاسترداد',
    checking: 'جارٍ التحقق…',
    missingLink: 'الرابط ناقص أو غير صحيح.',
    validTitle: 'قسيمة صالحة',
    invalidTitle: 'قسيمة غير صالحة',
    fallbackError: 'تعذّر التحقق من هذه القسيمة.',
  },
  en: {
    title: 'Confirm coupon',
    body: "Confirm this customer's wallet coupon to mark it redeemed.",
    confirm: 'Confirm redemption',
    checking: 'Checking…',
    missingLink: 'Missing or malformed link.',
    validTitle: 'Valid coupon',
    invalidTitle: 'Invalid coupon',
    fallbackError: 'Could not validate this coupon',
  },
  ur: {
    title: 'کوپن کی تصدیق',
    body: 'اس گاہک کا والیٹ کوپن تصدیق کریں تاکہ اسے ریڈیم شدہ درج کیا جائے۔',
    confirm: 'ریڈیم کی تصدیق کریں',
    checking: 'چیک ہو رہا ہے…',
    missingLink: 'لنک نامکمل یا غلط ہے۔',
    validTitle: 'درست کوپن',
    invalidTitle: 'غلط کوپن',
    fallbackError: 'اس کوپن کی تصدیق نہیں ہو سکی۔',
  },
}
