import type { Locale } from './locale'

// Fixed chrome text for src/app/wallet/language (the page behind the Wallet
// card's "Change language" link) — same three-locale system already used
// everywhere else (see offers.ts, landing.ts, dashboard.ts). This page's
// OWN language (which of these three strings renders) is picked the usual
// localStorage way via useLocale(); the choice the customer actually makes
// ON this page is a separate, persisted thing (wallet_members.
// preferred_language) — see WalletLanguagePicker.tsx.
export interface WalletLanguageCopy {
  heading: string
  body: string
  automatic: string
  automaticHint: string
  saving: string
  saved: string
  error: string
  back: string
  browseShops: string
}

export const WALLET_LANGUAGE_COPY: Record<Locale, WalletLanguageCopy> = {
  ar: {
    heading: 'لغة بطاقة المحفظة',
    body: 'اختر اللغة التي تظهر بها بطاقة عروض جيران في محفظتك. هذا الاختيار يحل محل لغة هاتفك لهذه البطاقة تحديداً.',
    automatic: 'تلقائي (حسب لغة هاتفي)',
    automaticHint: 'الوضع الافتراضي — تتبع البطاقة لغة هاتفك أو حساب Google تلقائياً.',
    saving: 'جارٍ الحفظ…',
    saved: 'تم الحفظ — ستتحدث بطاقتك خلال لحظات.',
    error: 'حدث خطأ ما — حاول مرة أخرى.',
    back: 'رجوع',
    browseShops: 'تصفح المحلات القريبة منك',
  },
  en: {
    heading: 'Wallet card language',
    body: 'Choose the language your Jeeran Offers Wallet card shows. This overrides your phone’s own language for this card specifically.',
    automatic: 'Automatic (match my phone)',
    automaticHint: "Default — the card follows your phone or Google account language on its own.",
    saving: 'Saving…',
    saved: 'Saved — your card will update shortly.',
    error: 'Something went wrong — please try again.',
    back: 'Back',
    browseShops: 'Browse shops near you',
  },
  ur: {
    heading: 'والٹ کارڈ کی زبان',
    body: 'وہ زبان منتخب کریں جس میں آپ کا جیران آفرز والٹ کارڈ دکھایا جائے۔ یہ خاص طور پر اس کارڈ کے لیے آپ کے فون کی زبان کو بدل دیتا ہے۔',
    automatic: 'خودکار (میرے فون کے مطابق)',
    automaticHint: 'ڈیفالٹ — کارڈ خود بخود آپ کے فون یا گوگل اکاؤنٹ کی زبان اپناتا ہے۔',
    saving: 'محفوظ ہو رہا ہے…',
    saved: 'محفوظ ہو گیا — آپ کا کارڈ جلد اپ ڈیٹ ہو جائے گا۔',
    error: 'کچھ غلط ہو گیا — دوبارہ کوشش کریں۔',
    back: 'واپس',
    browseShops: 'اپنے قریب دکانیں دیکھیں',
  },
}
