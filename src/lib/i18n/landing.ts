import type { Locale } from './locale'

// Landing page copy. Arabic is the base (approved mockup,
// downloads/handoff/landing-auth/landing.html); en and ur are translations.
// Claims are kept to what the product actually does:
//   - Shops get a 3-month free trial, then a monthly subscription
//     (businesses.trial_ends_at, 20260714_trial_period.sql) — so "free for
//     the first 3 months", never "free for the shop".
//   - Offers on a host's QR page come from other shops across the network
//     (get_top_ads() has no distance filter); only the customer's saved
//     Wallet card is filtered to offers near them. Wording says "other
//     shops" for the QR page and "near you" only for the card.
//   - Google Wallet only (no Apple Wallet), and nothing that implies the
//     pass is open to everyone while the issuer is still in test mode.
export interface LandingCopy {
  brand: string
  brandLatin: string
  nav: { browse: string; customers: string; login: string; loginShort: string }
  hero: {
    headline: string
    sub: string
    ctaOwner: string
    ctaCustomer: string
    assurances: [string, string, string]
    photoAlt: string
  }
  sampleCard: {
    label: string
    title: string
    codeLabel: string
  }
  how: {
    eyebrow: string
    heading: string
    steps: [{ title: string; body: string }, { title: string; body: string }, { title: string; body: string }]
  }
  customers: {
    eyebrow: string
    heading: string
    rows: [{ title: string; body: string }, { title: string; body: string }, { title: string; body: string }]
    photoAlt: string
  }
  why: {
    eyebrow: string
    heading: string
    points: [{ title: string; body: string }, { title: string; body: string }, { title: string; body: string }]
  }
  closing: { heading: string; sub: string }
  footer: {
    tagline: string
    product: string
    forShops: string
    contact: string
    whatsapp: string
    language: string
    rights: string
  }
}

export const LANDING_COPY: Record<Locale, LandingCopy> = {
  ar: {
    brand: 'جيران',
    brandLatin: 'Jeeran',
    nav: { browse: 'تصفح المحلات', customers: 'للعملاء', login: 'تسجيل الدخول', loginShort: 'دخول' },
    hero: {
      headline: 'جيرانك هم أفضل من يعلن عنك.',
      sub: 'استضف رمز QR يعرض عروض محلات أخرى واكسب نقاطًا إعلانية، ثم استخدمها لعرض عروضك عند رموزهم. بلا وكالة إعلانية وبلا هدر.',
      ctaOwner: 'أنا صاحب محل',
      ctaCustomer: 'أنا عميل: تصفح العروض',
      assurances: ['مجاني لأول 3 أشهر', 'بلا تطبيق للعميل', 'عروض قريبة على بطاقة العميل'],
      photoAlt: 'شارع في حي سعودي تقليدي عند الغروب، تحفّه أشجار النخيل والمحلات',
    },
    sampleCard: { label: 'مثال على البطاقة', title: 'عضويتك في شبكة جيران', codeLabel: 'رمز الاسترداد' },
    how: {
      eyebrow: 'كيف تعمل',
      heading: 'ثلاث خطوات من طاولتك إلى عملاء جدد',
      steps: [
        {
          title: 'استضف حامل QR',
          body: 'اطبع رمز QR الخاص بك وضعه على الطاولة. كل عرض لمحل آخر يُعرض من خلاله يكسبك نقاطًا.',
        },
        {
          title: 'عرضك ينتقل',
          body: 'استخدم النقاط لتشغيل حملتك، فيظهر عرضك عند رموز QR في محلات أخرى، وفي بطاقات العملاء القريبين من محلك.',
        },
        {
          title: 'استرداد عبر Google Wallet',
          body: 'يحفظ العميل عضويته في Google Wallet ويستردّ عرضك في المحل. بلا تطبيق ولا قسائم ورقية.',
        },
      ],
    },
    customers: {
      eyebrow: 'للعملاء',
      heading: 'امسح، احفظ، استفد',
      rows: [
        { title: 'امسح رمز المحل', body: 'تجده على طاولة المحل، ويعرض لك عروضًا من محلات أخرى في جيران.' },
        { title: 'احفظ العضوية', body: 'بطاقة واحدة في Google Wallet تعرض العروض القريبة منك، بلا حساب ولا تطبيق.' },
        { title: 'استرد عرضك', body: 'أظهر رمز البطاقة للمحل واحصل على العرض.' },
      ],
      photoAlt: 'شارع في حي سعودي عند الغروب',
    },
    why: {
      eyebrow: 'لماذا جيران',
      heading: 'بسيط، وللحيّ',
      points: [
        { title: 'ابدأ مجانًا', body: 'أول 3 أشهر مجانًا، والنقاط الأولى تأتي من أول عرض يُعرض عندك.' },
        { title: 'بلا تطبيق', body: 'العميل يمسح الرمز ويحفظ بطاقته في Google Wallet مباشرة.' },
        { title: 'عروض قريبة من العميل', body: 'بطاقة العميل تعرض عروض المحلات القريبة من موقعه، فيصل عرضك إلى من هم حولك.' },
      ],
    },
    closing: { heading: 'ابدأ بحامل واحد على طاولتك', sub: 'جرّبه مجانًا لمدة 3 أشهر.' },
    footer: {
      tagline: 'شبكة إعلانات محلية بين محلات الحي في السعودية.',
      product: 'المنتج',
      forShops: 'للمحلات',
      contact: 'تواصل معنا',
      whatsapp: 'واتساب',
      language: 'اللغة',
      rights: 'شبكة جيران الرقمية',
    },
  },
  en: {
    brand: 'Jeeran',
    brandLatin: 'جيران',
    nav: { browse: 'Browse shops', customers: 'For customers', login: 'Log in', loginShort: 'Log in' },
    hero: {
      headline: 'Your neighbors are your best advertisers.',
      sub: "Host a QR code that shows other shops' offers and earn ad credits, then spend them to show your own offers at their codes. No ad agency, no wasted spend.",
      ctaOwner: "I'm a shop owner",
      ctaCustomer: "I'm a customer: browse offers",
      assurances: ['Free for the first 3 months', 'No app for customers', "Nearby offers on the customer's card"],
      photoAlt: 'A traditional Saudi neighborhood street at sunset, lined with palm trees and shops',
    },
    sampleCard: { label: 'Example card', title: 'Your Jeeran membership', codeLabel: 'Redeem code' },
    how: {
      eyebrow: 'How it works',
      heading: 'Three steps from your counter to new customers',
      steps: [
        {
          title: 'Host a QR stand',
          body: "Print your QR code and set it on the counter. Every other shop's offer shown through it earns you credits.",
        },
        {
          title: 'Your offer travels',
          body: "Spend the credits on your own campaign: your offer appears at other shops' QR codes and on the cards of customers near your shop.",
        },
        {
          title: 'Redeemed with Google Wallet',
          body: 'Customers save their membership in Google Wallet and redeem your offer in person. No app, no paper coupons.',
        },
      ],
    },
    customers: {
      eyebrow: 'For customers',
      heading: 'Scan, save, enjoy',
      rows: [
        { title: "Scan the shop's code", body: "You'll find it on the counter. It shows you offers from other shops on Jeeran." },
        { title: 'Save the membership', body: 'One card in Google Wallet that shows offers near you. No account, no app.' },
        { title: 'Redeem your offer', body: "Show the card's code at the shop and get the offer." },
      ],
      photoAlt: 'A Saudi neighborhood street at sunset',
    },
    why: {
      eyebrow: 'Why Jeeran',
      heading: 'Simple, and made for the neighborhood',
      points: [
        { title: 'Start free', body: 'The first 3 months are free, and your first credits come from the first offer shown at your place.' },
        { title: 'No app', body: 'Customers scan the code and save their card straight to Google Wallet.' },
        { title: 'Offers near the customer', body: "The customer's card shows offers from shops near them, so your offer reaches people around you." },
      ],
    },
    closing: { heading: 'Start with one stand on your counter', sub: 'Try it free for 3 months.' },
    footer: {
      tagline: "A local ad network between neighborhood shops in Saudi Arabia.",
      product: 'Product',
      forShops: 'For shops',
      contact: 'Contact us',
      whatsapp: 'WhatsApp',
      language: 'Language',
      rights: 'Jeeran Digital Network',
    },
  },
  ur: {
    brand: 'جیران',
    brandLatin: 'Jeeran',
    nav: { browse: 'دکانیں دیکھیں', customers: 'گاہکوں کے لیے', login: 'لاگ اِن', loginShort: 'لاگ اِن' },
    hero: {
      headline: 'آپ کے پڑوسی ہی آپ کے بہترین اشتہاری ہیں۔',
      sub: 'ایک QR کوڈ رکھیں جو دوسری دکانوں کے آفرز دکھائے اور ایڈ کریڈٹس کمائیں، پھر انہیں اپنے آفرز ان کے کوڈز پر دکھانے کے لیے استعمال کریں۔ نہ کوئی ایڈ ایجنسی، نہ ضائع خرچ۔',
      ctaOwner: 'میں دکان کا مالک ہوں',
      ctaCustomer: 'میں گاہک ہوں: آفرز دیکھیں',
      assurances: ['پہلے 3 مہینے مفت', 'گاہک کے لیے کوئی ایپ نہیں', 'گاہک کے کارڈ پر قریبی آفرز'],
      photoAlt: 'غروبِ آفتاب کے وقت ایک روایتی سعودی محلے کی گلی، کھجور کے درختوں اور دکانوں کے ساتھ',
    },
    sampleCard: { label: 'کارڈ کی مثال', title: 'جیران میں آپ کی رکنیت', codeLabel: 'ریڈیم کوڈ' },
    how: {
      eyebrow: 'یہ کیسے کام کرتا ہے',
      heading: 'آپ کے کاؤنٹر سے نئے گاہکوں تک تین قدم',
      steps: [
        {
          title: 'QR اسٹینڈ رکھیں',
          body: 'اپنا QR کوڈ پرنٹ کر کے کاؤنٹر پر رکھیں۔ اس کے ذریعے دکھایا گیا ہر دوسری دکان کا آفر آپ کو کریڈٹس دلاتا ہے۔',
        },
        {
          title: 'آپ کا آفر آگے پہنچتا ہے',
          body: 'کریڈٹس سے اپنی مہم چلائیں: آپ کا آفر دوسری دکانوں کے QR کوڈز پر اور آپ کی دکان کے قریب گاہکوں کے کارڈز پر نظر آتا ہے۔',
        },
        {
          title: 'Google Wallet سے ریڈیم',
          body: 'گاہک اپنی رکنیت Google Wallet میں محفوظ کرتا ہے اور دکان پر آ کر آپ کا آفر حاصل کرتا ہے۔ نہ ایپ، نہ کاغذی کوپن۔',
        },
      ],
    },
    customers: {
      eyebrow: 'گاہکوں کے لیے',
      heading: 'اسکین کریں، محفوظ کریں، فائدہ اٹھائیں',
      rows: [
        { title: 'دکان کا کوڈ اسکین کریں', body: 'یہ کاؤنٹر پر ملے گا، اور آپ کو جیران پر دوسری دکانوں کے آفرز دکھاتا ہے۔' },
        { title: 'رکنیت محفوظ کریں', body: 'Google Wallet میں ایک کارڈ جو آپ کے قریب کے آفرز دکھاتا ہے۔ نہ اکاؤنٹ، نہ ایپ۔' },
        { title: 'اپنا آفر حاصل کریں', body: 'دکان پر کارڈ کا کوڈ دکھائیں اور آفر حاصل کریں۔' },
      ],
      photoAlt: 'غروبِ آفتاب کے وقت ایک سعودی محلے کی گلی',
    },
    why: {
      eyebrow: 'جیران کیوں',
      heading: 'آسان، اور محلے کے لیے',
      points: [
        { title: 'مفت شروع کریں', body: 'پہلے 3 مہینے مفت، اور پہلے کریڈٹس آپ کے یہاں دکھائے گئے پہلے آفر سے آتے ہیں۔' },
        { title: 'کوئی ایپ نہیں', body: 'گاہک کوڈ اسکین کر کے اپنا کارڈ سیدھا Google Wallet میں محفوظ کرتا ہے۔' },
        { title: 'گاہک کے قریب آفرز', body: 'گاہک کا کارڈ اس کے قریب کی دکانوں کے آفرز دکھاتا ہے، اس لیے آپ کا آفر آپ کے آس پاس کے لوگوں تک پہنچتا ہے۔' },
      ],
    },
    closing: { heading: 'اپنے کاؤنٹر پر ایک اسٹینڈ سے شروع کریں', sub: '3 مہینے مفت آزمائیں۔' },
    footer: {
      tagline: 'سعودی عرب میں محلے کی دکانوں کے درمیان ایک مقامی اشتہاری نیٹ ورک۔',
      product: 'پروڈکٹ',
      forShops: 'دکانوں کے لیے',
      contact: 'رابطہ کریں',
      whatsapp: 'واٹس ایپ',
      language: 'زبان',
      rights: 'جیران ڈیجیٹل نیٹ ورک',
    },
  },
}
