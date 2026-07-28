import type { Locale } from './locale'

export interface LandingCopy {
  brandSubtitle: string | null
  login: string
  browse: string
  headline: string
  subheadline: string
  ctaBusiness: string
  step1Title: string
  step1Body: string
  step2Title: string
  step2Body: string
  step3Title: string
  step3Body: string
}

export const LANDING_COPY: Record<Locale, LandingCopy> = {
  ar: {
    brandSubtitle: null,
    login: 'تسجيل الدخول',
    browse: 'تصفح المحلات',
    headline: 'جيرانك هم أفضل من يعلن عنك.',
    subheadline:
      'استضف حامل رمز QR للمحلات المجاورة واكسب نقاط إعلانية — ثم استخدمها لعرض عروضك في محلاتهم. بلا وكالة إعلانية، بلا هدر، فقط جيرانك.',
    ctaBusiness: 'أنا صاحب عمل',
    step1Title: 'استضف حامل QR',
    step1Body: 'اطبع رمز QR الخاص بك وضعه على الطاولة. كل عرض لمحل مجاور يُعرض من خلاله يكسبك نقاطًا.',
    step2Title: 'عرضك ينتقل',
    step2Body: 'استخدم تلك النقاط لتشغيل حملتك الخاصة — تظهر في محلات جيرانك، لتصل إلى عملاء لم تكن لتصلهم بطريقة أخرى.',
    step3Title: 'استرداد عبر Wallet',
    step3Body: 'يحفظ العملاء عرضك مباشرة في Apple Wallet ويستردونه شخصيًا — بلا تطبيق يُثبَّت، وبلا قسائم ورقية.',
  },
  en: {
    brandSubtitle: 'شبكة جيران الرقمية',
    login: 'Log in',
    browse: 'Browse shops',
    headline: 'Your neighbors are your best advertisers.',
    subheadline:
      "Host a QR stand for nearby businesses and earn ad credits — then spend them getting your own offers seen at their counters. No ad agency, no wasted spend, just the shops around you.",
    ctaBusiness: "I'm a Business Owner",
    step1Title: 'Host a QR stand',
    step1Body:
      "Print your dedicated QR code and set it on the counter. Every neighboring business's offer shown through it earns you credits.",
    step2Title: 'Your offer travels',
    step2Body:
      "Spend those credits running your own campaign — it shows up on your neighbors' stands, reaching customers you'd never otherwise see.",
    step3Title: 'Redeemed in Wallet',
    step3Body:
      'Customers save your offer straight to Apple Wallet and redeem it in person — no app to install, no printed coupons.',
  },
  ur: {
    brandSubtitle: 'شبكة جيران الرقمية',
    login: 'لاگ اِن',
    browse: 'دکانیں دیکھیں',
    headline: 'آپ کے پڑوسی ہی آپ کے بہترین اشتہاری ہیں۔',
    subheadline:
      'قریبی کاروباروں کے لیے QR اسٹینڈ کی میزبانی کریں اور ایڈ کریڈٹس کمائیں — پھر انہیں اپنے آفرز ان کے کاؤنٹر پر دکھانے کے لیے خرچ کریں۔ نہ کوئی ایڈ ایجنسی، نہ ضائع شدہ خرچ، بس آپ کے ارد گرد کی دکانیں۔',
    ctaBusiness: 'میں ایک کاروباری مالک ہوں',
    step1Title: 'QR اسٹینڈ کی میزبانی کریں',
    step1Body:
      'اپنا مخصوص QR کوڈ پرنٹ کریں اور کاؤنٹر پر رکھیں۔ اس کے ذریعے دکھایا گیا ہر پڑوسی کاروبار کا آفر آپ کو کریڈٹس دلاتا ہے۔',
    step2Title: 'آپ کا آفر سفر کرتا ہے',
    step2Body:
      'وہ کریڈٹس اپنی مہم چلانے کے لیے خرچ کریں — یہ آپ کے پڑوسیوں کے اسٹینڈز پر ظاہر ہوتا ہے، ان گاہکوں تک پہنچتا ہے جن تک آپ کبھی نہ پہنچ پاتے۔',
    step3Title: 'Wallet میں چھڑایا گیا',
    step3Body:
      'گاہک آپ کا آفر براہ راست Apple Wallet میں محفوظ کرتے ہیں اور خود آ کر چھڑاتے ہیں — نہ کوئی ایپ انسٹال کرنی ہے، نہ پرنٹ شدہ کوپن۔',
  },
}
