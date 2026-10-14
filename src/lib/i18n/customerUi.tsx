import type { ReactNode } from 'react'
import type { Locale } from './locale'

// Fixed chrome text for the refreshed customer screens (Home, Offers, Offer
// detail, Scan, Shops — see docs/design-reference/). Arabic is the brief's
// own copy; English is written natively; Urdu is a best effort that still
// needs a native speaker's review. Functions return ReactNode so numbers,
// "+N" and shop names can be direction-isolated with <bdi> — a plain
// string can't stop "+4" rendering as "4+" inside an RTL sentence.
// Shop-typed content (business names, offer text) is passed in, never
// translated.

const num = (n: number | string) => <bdi dir="ltr">{n}</bdi>
const shop = (name: string) => <bdi dir="auto">{name}</bdi>

// Arabic counted nouns: 1 / 2 / 3–10 / 11+ take different forms.
function arCount(n: number, one: string, two: string, few: (n: ReactNode) => ReactNode, many: (n: ReactNode) => ReactNode): ReactNode {
  if (n === 1) return one
  if (n === 2) return two
  return n >= 3 && n <= 10 ? few(num(n)) : many(num(n))
}

export interface CustomerUiCopy {
  free: string
  details: string
  viewAll: string
  endsToday: string
  endsInDays: (n: number) => ReactNode
  awayFromYou: (distance: ReactNode) => ReactNode
  retry: string
  back: string
  share: string
  linkCopied: string
  home: {
    greeting: string
    sub: string
    searchPlaceholder: string
    searchLabel: string
    cardLabel: string
    moreOnCard: (n: number) => ReactNode
    noCardOffer: string
    categoriesLabel: string
    featured: string
    locationCurrent: string
    locationEnable: string
  }
  offers: {
    title: string
    available: (n: number) => ReactNode
    searchPlaceholder: string
    noMatch: string
  }
  detail: {
    directions: string
    howTo: string
    steps: [string, string, string]
    oncePerCustomer: string
    call: string
    whatsapp: string
  }
  scan: {
    visitRecorded: string
    welcome: string
    atShop: (name: string) => ReactNode
    cardTitle: string
    cardBody: string
    addToWallet: string
    saving: string
    trustFree: string
    trustNoApp: string
    trustRemove: string
    offersFrom: (name: string) => ReactNode
    youreIn: string
    youreInBody: string
    continueToWallet: string
    appNudge: string
    getWalletApp: string
    dismiss: string
    genericError: string
    unavailable: string
  }
  shops: {
    noOfferNow: string
  }
  empty: {
    noOffersTitle: string
    noOffersBody: string
    invite: string
    inviteText: string
    geoTitle: string
    geoBody: string
    errorTitle: string
    errorBody: string
  }
}

export const CUSTOMER_UI_COPY: Record<Locale, CustomerUiCopy> = {
  ar: {
    free: 'مجاني',
    details: 'التفاصيل',
    viewAll: 'عرض الكل',
    endsToday: 'ينتهي اليوم',
    endsInDays: (n) => (n === 1 ? 'ينتهي غدًا' : n === 2 ? 'ينتهي خلال يومين' : <>ينتهي خلال {num(n)} أيام</>),
    awayFromYou: (d) => <>{d} منك</>,
    retry: 'حاول مرة أخرى',
    back: 'رجوع',
    share: 'مشاركة العرض',
    linkCopied: 'تم نسخ الرابط',
    home: {
      greeting: 'أهلًا بك',
      sub: 'جيرانك عندهم عروض لك اليوم',
      searchPlaceholder: 'ابحث عن محل أو عرض…',
      searchLabel: 'بحث',
      cardLabel: 'بطاقتك الآن',
      moreOnCard: (n) =>
        arCount(
          n,
          'عرض آخر على بطاقتك',
          'عرضان آخران على بطاقتك',
          () => <>{num(`+${n}`)} عروض أخرى على بطاقتك</>,
          () => <>{num(`+${n}`)} عرضًا آخر على بطاقتك</>,
        ),
      noCardOffer: 'لا توجد عروض على بطاقتك الآن. سنضيفها فور توفرها.',
      categoriesLabel: 'الفئات',
      featured: 'عروض مميزة قربك',
      locationCurrent: 'موقعك الحالي',
      locationEnable: 'فعّل الموقع',
    },
    offers: {
      title: 'عروض قريبة منك',
      available: (n) =>
        arCount(
          n,
          'عرض واحد متاح حولك الآن',
          'عرضان متاحان حولك الآن',
          (x) => <>{x} عروض متاحة حولك الآن</>,
          (x) => <>{x} عرضًا متاحًا حولك الآن</>,
        ),
      searchPlaceholder: 'ابحث عن عرض أو محل أو فئة…',
      noMatch: 'لا توجد عروض مطابقة لبحثك.',
    },
    detail: {
      directions: 'اتجاهات إلى المحل',
      howTo: 'كيف تستفيد من العرض؟',
      steps: [
        'توجّه إلى المحل، فالعرض ظاهر على بطاقتك',
        'اعرض بطاقة جيران في Wallet عند الكاشير',
        'يمسح الكاشير الباركود وتحصل على عرضك',
      ],
      oncePerCustomer: 'مرة واحدة لكل عميل',
      call: 'اتصال بالمحل',
      whatsapp: 'مراسلة عبر واتساب',
    },
    scan: {
      visitRecorded: 'تم تسجيل زيارتك',
      welcome: 'أهلًا بك في جيران',
      atShop: (name) => <>أنت الآن في {shop(name)}، وهذه عروض جيرانه القريبين منك.</>,
      cardTitle: 'بطاقتك الدائمة في Wallet',
      cardBody: 'احفظها مرة واحدة وستصلك العروض القريبة تلقائيًا، بدون تطبيق.',
      addToWallet: 'أضف إلى Google Wallet',
      saving: 'جارٍ التجهيز…',
      trustFree: 'مجانًا',
      trustNoApp: 'بدون تحميل تطبيق',
      trustRemove: 'احذفها متى شئت',
      offersFrom: (name) => <>عروض من جيران {shop(name)}</>,
      youreIn: 'تم! أنت معنا',
      youreInBody: 'ستبدأ عروض المحلات القريبة بالظهور على بطاقتك قريبًا.',
      continueToWallet: 'تابع إلى Google Wallet',
      appNudge:
        'نصيحة: ثبّت تطبيق Google Wallet المجاني لتصلك تنبيهات العروض الجديدة على شاشة القفل. بطاقتك تعمل بدونه، لكن قد لا تصلك التنبيهات.',
      getWalletApp: 'تحميل Google Wallet',
      dismiss: 'إغلاق',
      genericError: 'تعذّر تجهيز البطاقة. حاول مرة أخرى.',
      unavailable: 'هذا المحل غير متاح مؤقتًا.',
    },
    shops: {
      noOfferNow: 'لا يوجد عرض الآن',
    },
    empty: {
      noOffersTitle: 'لا توجد عروض قربك بعد',
      noOffersBody: 'نضيف محلات جديدة باستمرار. ادعُ محلك المفضل لينضم إلى جيران.',
      invite: 'ادعُ محلًا في حيّك',
      inviteText: 'انضم إلى جيران واعرض عروض محلك لسكان الحي:',
      geoTitle: 'لم نتمكن من تحديد موقعك',
      geoBody: 'فعّل إذن الموقع في المتصفح لنعرض لك العروض الأقرب إليك.',
      errorTitle: 'حدث خطأ',
      errorBody: 'تعذّر تحميل العروض. تحقق من اتصالك وحاول مرة أخرى.',
    },
  },
  en: {
    free: 'Free',
    details: 'Details',
    viewAll: 'View all',
    endsToday: 'Ends today',
    endsInDays: (n) => (n === 1 ? 'Ends tomorrow' : <>Ends in {num(n)} days</>),
    awayFromYou: (d) => <>{d} away</>,
    retry: 'Try again',
    back: 'Back',
    share: 'Share offer',
    linkCopied: 'Link copied',
    home: {
      greeting: 'Welcome',
      sub: 'Your neighbours have offers for you today',
      searchPlaceholder: 'Search shops or offers…',
      searchLabel: 'Search',
      cardLabel: 'Your card right now',
      moreOnCard: (n) => <>{num(`+${n}`)} more on your card</>,
      noCardOffer: "Nothing on your card yet. We'll add offers as soon as they're available.",
      categoriesLabel: 'Categories',
      featured: 'Featured near you',
      locationCurrent: 'Your location',
      locationEnable: 'Turn on location',
    },
    offers: {
      title: 'Offers near you',
      available: (n) => (n === 1 ? '1 offer available around you now' : <>{num(n)} offers available around you now</>),
      searchPlaceholder: 'Search offers, shops or categories…',
      noMatch: 'No offers match your search.',
    },
    detail: {
      directions: 'Directions to the shop',
      howTo: 'How to redeem',
      steps: [
        'Head to the shop — the offer is already on your card',
        'Show your Jeeran card in Wallet at the till',
        'The cashier scans the barcode and you get your offer',
      ],
      oncePerCustomer: 'Once per customer',
      call: 'Call the shop',
      whatsapp: 'Message on WhatsApp',
    },
    scan: {
      visitRecorded: 'Visit recorded',
      welcome: 'Welcome to Jeeran',
      atShop: (name) => <>You&apos;re at {shop(name)}. Here are offers from shops nearby.</>,
      cardTitle: 'Your permanent card in Wallet',
      cardBody: 'Save it once and nearby offers reach you automatically — no app needed.',
      addToWallet: 'Add to Google Wallet',
      saving: 'Preparing…',
      trustFree: 'Free',
      trustNoApp: 'No app to install',
      trustRemove: 'Remove anytime',
      offersFrom: (name) => <>Offers from {shop(name)}&apos;s neighbours</>,
      youreIn: "You're in!",
      youreInBody: 'Offers from shops near you will start showing up on your card soon.',
      continueToWallet: 'Continue to Google Wallet',
      appNudge:
        "Tip: get the free Google Wallet app to receive new-offer alerts on your lock screen. Your card works without it, but you may not receive notifications.",
      getWalletApp: 'Get Google Wallet',
      dismiss: 'Dismiss',
      genericError: "Couldn't prepare your card. Please try again.",
      unavailable: 'This shop is temporarily unavailable.',
    },
    shops: {
      noOfferNow: 'No offer right now',
    },
    empty: {
      noOffersTitle: 'No offers near you yet',
      noOffersBody: 'New shops join all the time. Invite your favourite one to Jeeran.',
      invite: 'Invite a shop near you',
      inviteText: 'Join Jeeran and show your shop’s offers to the neighbourhood:',
      geoTitle: "We couldn't find your location",
      geoBody: 'Allow location access in your browser so we can show the offers closest to you.',
      errorTitle: 'Something went wrong',
      errorBody: "We couldn't load offers. Check your connection and try again.",
    },
  },
  // Urdu: best-effort, needs native review.
  ur: {
    free: 'مفت',
    details: 'تفصیلات',
    viewAll: 'سب دیکھیں',
    endsToday: 'آج ختم ہو رہا ہے',
    endsInDays: (n) => (n === 1 ? 'کل ختم ہو رہا ہے' : <>{num(n)} دن میں ختم</>),
    awayFromYou: (d) => <>آپ سے {d}</>,
    retry: 'دوبارہ کوشش کریں',
    back: 'واپس',
    share: 'آفر شیئر کریں',
    linkCopied: 'لنک کاپی ہو گیا',
    home: {
      greeting: 'خوش آمدید',
      sub: 'آج آپ کے پڑوسیوں کے پاس آپ کے لیے آفرز ہیں',
      searchPlaceholder: 'دکان یا آفر تلاش کریں…',
      searchLabel: 'تلاش',
      cardLabel: 'آپ کا کارڈ ابھی',
      moreOnCard: (n) => <>آپ کے کارڈ پر {num(`+${n}`)} مزید آفرز</>,
      noCardOffer: 'ابھی آپ کے کارڈ پر کوئی آفر نہیں۔ دستیاب ہوتے ہی شامل کر دیں گے۔',
      categoriesLabel: 'کیٹگریز',
      featured: 'آپ کے قریب نمایاں آفرز',
      locationCurrent: 'آپ کا مقام',
      locationEnable: 'لوکیشن آن کریں',
    },
    offers: {
      title: 'آپ کے قریب آفرز',
      available: (n) => <>ابھی آپ کے ارد گرد {num(n)} آفرز دستیاب ہیں</>,
      searchPlaceholder: 'آفر، دکان یا کیٹگری تلاش کریں…',
      noMatch: 'آپ کی تلاش سے کوئی آفر نہیں ملی۔',
    },
    detail: {
      directions: 'دکان تک راستہ',
      howTo: 'آفر کیسے حاصل کریں؟',
      steps: [
        'دکان پر جائیں — آفر آپ کے کارڈ پر موجود ہے',
        'کیشیئر کو Wallet میں اپنا جیران کارڈ دکھائیں',
        'کیشیئر بارکوڈ اسکین کرے گا اور آپ کو آفر مل جائے گی',
      ],
      oncePerCustomer: 'ہر گاہک کے لیے ایک بار',
      call: 'دکان کو کال کریں',
      whatsapp: 'واٹس ایپ پر پیغام',
    },
    scan: {
      visitRecorded: 'آپ کی آمد درج ہو گئی',
      welcome: 'جیران میں خوش آمدید',
      atShop: (name) => <>آپ ابھی {shop(name)} میں ہیں، اور یہ اس کے قریبی پڑوسیوں کی آفرز ہیں۔</>,
      cardTitle: 'Wallet میں آپ کا مستقل کارڈ',
      cardBody: 'ایک بار محفوظ کریں، قریبی آفرز خود بخود آپ تک پہنچیں گی — کسی ایپ کے بغیر۔',
      addToWallet: 'Google Wallet میں شامل کریں',
      saving: 'تیار ہو رہا ہے…',
      trustFree: 'مفت',
      trustNoApp: 'کوئی ایپ نہیں',
      trustRemove: 'جب چاہیں ہٹائیں',
      offersFrom: (name) => <>{shop(name)} کے پڑوسیوں کی آفرز</>,
      youreIn: 'آپ شامل ہو گئے!',
      youreInBody: 'قریبی دکانوں کی آفرز جلد آپ کے کارڈ پر نظر آنا شروع ہو جائیں گی۔',
      continueToWallet: 'Google Wallet پر جاری رکھیں',
      appNudge:
        'مشورہ: لاک اسکرین پر نئی آفرز کی اطلاع کے لیے مفت Google Wallet ایپ انسٹال کریں۔ کارڈ اس کے بغیر بھی کام کرتا ہے، لیکن ممکن ہے آپ کو اطلاعات نہ ملیں۔',
      getWalletApp: 'Google Wallet حاصل کریں',
      dismiss: 'بند کریں',
      genericError: 'کارڈ تیار نہیں ہو سکا۔ دوبارہ کوشش کریں۔',
      unavailable: 'یہ دکان عارضی طور پر دستیاب نہیں ہے۔',
    },
    shops: {
      noOfferNow: 'ابھی کوئی آفر نہیں',
    },
    empty: {
      noOffersTitle: 'ابھی آپ کے قریب کوئی آفر نہیں',
      noOffersBody: 'نئی دکانیں مسلسل شامل ہو رہی ہیں۔ اپنی پسندیدہ دکان کو جیران میں مدعو کریں۔',
      invite: 'اپنے محلے کی دکان کو مدعو کریں',
      inviteText: 'جیران میں شامل ہوں اور اپنی دکان کی آفرز محلے کو دکھائیں:',
      geoTitle: 'آپ کا مقام معلوم نہیں ہو سکا',
      geoBody: 'براؤزر میں لوکیشن کی اجازت دیں تاکہ ہم آپ کو قریب ترین آفرز دکھا سکیں۔',
      errorTitle: 'کچھ غلط ہو گیا',
      errorBody: 'آفرز لوڈ نہیں ہو سکیں۔ کنکشن چیک کر کے دوبارہ کوشش کریں۔',
    },
  },
}
