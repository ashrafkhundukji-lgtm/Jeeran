import type { Locale } from '../shared/web'

// Strings only the native app needs. Everything the website already says
// (offers, credits, errors, auth) comes from the website's own tables via
// src/shared/web.ts; this file is only what has no web equivalent.
// Terminology as on the website: "رصيد إعلاني" / "ad credit" / "اشتہاری بیلنس".

export interface AppCopy {
  appName: string
  tabs: { home: string; offers: string; scan: string; credits: string; account: string }
  status: {
    showingTitle: string
    showingBody: string
    notShowingTitle: string
    switchedOff: string
    unknown: string
    unavailable: string
    createOffer: string
    switchOn: string
    editOffer: string
  }
  home: {
    quickActions: string
    newOffer: string
    editOffer: string
    allOffers: string
    switchOff: string
    switchOn: string
    language: string
    topUpOnWeb: string
  }
  offers: {
    empty: string
    imageKept: string
    switchOnConfirmTitle: string
    pickDate: string
  }
  offline: { banner: string; savedAt: string }
  onboarding: { skipLocation: string; locationDenied: string; locationFailed: string; back: string }
  account: { heading: string; signedInAs: string; comingSoon: string; comingSoonBody: string; version: string }
  scan: { title: string; body: string }
  creditsTab: { title: string; body: string }
  configMissing: string
  loading: string
}

export const APP_COPY: Record<Locale, AppCopy> = {
  ar: {
    appName: 'جيران للأعمال',
    tabs: { home: 'الرئيسية', offers: 'العروض', scan: 'المسح', credits: 'الرصيد', account: 'الحساب' },
    status: {
      showingTitle: 'عرضك ظاهر الآن',
      showingBody: 'يراه العملاء القريبون منك في جيران.',
      notShowingTitle: 'عرضك لا يظهر الآن',
      switchedOff: 'عرضك متوقف. فعّله ليظهر للعملاء القريبين.',
      unknown: 'تعذّر تحديد سبب عدم ظهور العرض. حاول التحديث بعد قليل.',
      unavailable: 'تعذّر التحقق من حالة العرض الآن.',
      createOffer: 'إنشاء عرض',
      switchOn: 'تفعيل العرض',
      editOffer: 'تعديل العرض',
    },
    home: {
      quickActions: 'إجراءات سريعة',
      newOffer: 'عرض جديد',
      editOffer: 'تعديل العرض',
      allOffers: 'كل العروض',
      switchOff: 'إيقاف العرض',
      switchOn: 'تفعيل العرض',
      language: 'اللغة',
      topUpOnWeb: 'لشحن الرصيد، استخدم جيران على الموقع.',
    },
    offers: {
      empty: 'لا توجد عروض بعد. أنشئ أول عرض ليظهر محلك للعملاء القريبين.',
      imageKept: 'صورة العرض الحالية محفوظة. تغيير الصورة متاح من الموقع حاليًا.',
      switchOnConfirmTitle: 'تفعيل العرض',
      pickDate: 'اختر التاريخ',
    },
    offline: { banner: 'لا يوجد اتصال — تعرض آخر بيانات محفوظة.', savedAt: 'آخر تحديث: {time}' },
    onboarding: {
      skipLocation: 'تخطَّ الآن',
      locationDenied: 'لم يُسمح بالوصول إلى الموقع. يمكنك تحديده لاحقًا من الملف الشخصي.',
      locationFailed: 'تعذّر تحديد موقعك. حاول مرة أخرى أو تخطَّ الآن.',
      back: 'رجوع',
    },
    account: {
      heading: 'الحساب',
      signedInAs: 'مسجّل الدخول باسم',
      comingSoon: 'قريبًا في التطبيق',
      comingSoonBody: 'تعديل بيانات المحل والشعار متاح الآن من الموقع، وسيصل إلى التطبيق في التحديث القادم.',
      version: 'الإصدار {v}',
    },
    scan: { title: 'مسح بطاقة العميل', body: 'المسح بالكاميرا يصل في التحديث القادم. حتى ذلك الحين استخدم صفحة الاستبدال على الموقع.' },
    creditsTab: { title: 'رصيدك الإعلاني', body: 'سجل الرصيد يصل في التحديث القادم.' },
    configMissing: 'إعدادات التطبيق ناقصة: {keys}',
    loading: 'جارٍ التحميل…',
  },
  en: {
    appName: 'Jeeran Business',
    tabs: { home: 'Home', offers: 'Offers', scan: 'Scan', credits: 'Credit', account: 'Account' },
    status: {
      showingTitle: 'Your offer is showing',
      showingBody: 'Nearby customers can see it on Jeeran.',
      notShowingTitle: 'Your offer is not showing',
      switchedOff: 'Your offer is switched off. Switch it on so nearby customers can see it.',
      unknown: "We couldn't tell why your offer isn't showing. Try refreshing in a moment.",
      unavailable: "Couldn't check your offer's status right now.",
      createOffer: 'Create an offer',
      switchOn: 'Switch on',
      editOffer: 'Edit offer',
    },
    home: {
      quickActions: 'Quick actions',
      newOffer: 'New offer',
      editOffer: 'Edit offer',
      allOffers: 'All offers',
      switchOff: 'Switch off',
      switchOn: 'Switch on',
      language: 'Language',
      topUpOnWeb: 'To top up, use Jeeran on the web.',
    },
    offers: {
      empty: 'No offers yet. Create your first offer so nearby customers can find your shop.',
      imageKept: 'The current offer photo is kept. Changing the photo is on the website for now.',
      switchOnConfirmTitle: 'Switch on offer',
      pickDate: 'Pick a date',
    },
    offline: { banner: "You're offline — showing the last saved data.", savedAt: 'Last updated: {time}' },
    onboarding: {
      skipLocation: 'Skip for now',
      locationDenied: 'Location access was not allowed. You can set it later in your profile.',
      locationFailed: "Couldn't find your location. Try again or skip for now.",
      back: 'Back',
    },
    account: {
      heading: 'Account',
      signedInAs: 'Signed in as',
      comingSoon: 'Coming to the app soon',
      comingSoonBody: 'Editing your shop details and logo is on the website for now and comes to the app in the next update.',
      version: 'Version {v}',
    },
    scan: { title: "Scan a customer's card", body: 'Camera scanning arrives in the next update. Until then, use the Redeem page on the website.' },
    creditsTab: { title: 'Your ad credit', body: 'Your credit history arrives in the next update.' },
    configMissing: 'App configuration is missing: {keys}',
    loading: 'Loading…',
  },
  ur: {
    appName: 'جیران بزنس',
    tabs: { home: 'ہوم', offers: 'آفرز', scan: 'اسکین', credits: 'بیلنس', account: 'اکاؤنٹ' },
    status: {
      showingTitle: 'آپ کی آفر دکھائی دے رہی ہے',
      showingBody: 'قریبی گاہک اسے جیران پر دیکھ سکتے ہیں۔',
      notShowingTitle: 'آپ کی آفر ابھی دکھائی نہیں دے رہی',
      switchedOff: 'آپ کی آفر بند ہے۔ اسے آن کریں تاکہ قریبی گاہک دیکھ سکیں۔',
      unknown: 'آفر نہ دکھنے کی وجہ معلوم نہیں ہو سکی۔ تھوڑی دیر بعد ریفریش کریں۔',
      unavailable: 'ابھی آفر کی حالت چیک نہیں ہو سکی۔',
      createOffer: 'آفر بنائیں',
      switchOn: 'آن کریں',
      editOffer: 'آفر میں ترمیم',
    },
    home: {
      quickActions: 'فوری کام',
      newOffer: 'نئی آفر',
      editOffer: 'آفر میں ترمیم',
      allOffers: 'تمام آفرز',
      switchOff: 'آفر بند کریں',
      switchOn: 'آفر آن کریں',
      language: 'زبان',
      topUpOnWeb: 'بیلنس بڑھانے کے لیے ویب سائٹ پر جیران استعمال کریں۔',
    },
    offers: {
      empty: 'ابھی کوئی آفر نہیں۔ پہلی آفر بنائیں تاکہ قریبی گاہک آپ کی دکان دیکھ سکیں۔',
      imageKept: 'آفر کی موجودہ تصویر محفوظ ہے۔ تصویر بدلنا فی الحال ویب سائٹ پر ہے۔',
      switchOnConfirmTitle: 'آفر آن کریں',
      pickDate: 'تاریخ منتخب کریں',
    },
    offline: { banner: 'انٹرنیٹ نہیں — آخری محفوظ معلومات دکھائی جا رہی ہیں۔', savedAt: 'آخری اپ ڈیٹ: {time}' },
    onboarding: {
      skipLocation: 'ابھی چھوڑیں',
      locationDenied: 'لوکیشن کی اجازت نہیں ملی۔ آپ اسے بعد میں پروفائل سے سیٹ کر سکتے ہیں۔',
      locationFailed: 'آپ کی لوکیشن نہیں مل سکی۔ دوبارہ کوشش کریں یا ابھی چھوڑیں۔',
      back: 'واپس',
    },
    account: {
      heading: 'اکاؤنٹ',
      signedInAs: 'لاگ اِن بطور',
      comingSoon: 'جلد ایپ میں',
      comingSoonBody: 'دکان کی تفصیلات اور لوگو میں ترمیم ابھی ویب سائٹ پر ہے، اگلی اپ ڈیٹ میں ایپ میں آئے گی۔',
      version: 'ورژن {v}',
    },
    scan: { title: 'گاہک کا کارڈ اسکین کریں', body: 'کیمرہ اسکین اگلی اپ ڈیٹ میں آئے گا۔ تب تک ویب سائٹ پر ریڈیم صفحہ استعمال کریں۔' },
    creditsTab: { title: 'آپ کا اشتہاری بیلنس', body: 'بیلنس کی تاریخ اگلی اپ ڈیٹ میں آئے گی۔' },
    configMissing: 'ایپ کی سیٹنگز نامکمل ہیں: {keys}',
    loading: 'لوڈ ہو رہا ہے…',
  },
}
