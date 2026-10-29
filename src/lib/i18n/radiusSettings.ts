import type { Locale } from './locale'

// Customer-side radius + location controls (RadiusSettings, WidenRadiusState)
// and the iPhone notice on the scan page and landing hero. Urdu still needs
// a native speaker's review, same as customerUi.tsx.
export interface RadiusSettingsCopy {
  heading: string
  helper: string
  km: (n: number) => string
  saving: string
  saved: string
  savedCardLater: string
  updateLocation: string
  locating: string
  locationUpdated: string
  locationDenied: string
  locationTimeout: string
  locationUnavailable: string
  privacy: string
  saveError: string
  tooMany: string
  compact: (n: number) => string
  change: string
  emptyTitle: (n: number) => string
  emptyBody: string
  widen: (n: number) => string
  widening: string
}

export const RADIUS_SETTINGS_COPY: Record<Locale, RadiusSettingsCopy> = {
  ar: {
    heading: 'العروض ضمن مسافة',
    helper: 'اختر إلى أي مدى نبحث عن عروض حول موقعك المحفوظ.',
    km: (n) => `${n} كم`,
    saving: 'جارٍ الحفظ…',
    saved: 'تم الحفظ',
    savedCardLater: 'تم الحفظ. ستتحدّث بطاقتك في المحفظة قريبًا.',
    updateLocation: 'حدّث موقعي',
    locating: 'جارٍ تحديد موقعك…',
    locationUpdated: 'تم تحديث الموقع',
    locationDenied:
      'إذن الموقع مغلق. افتح إعدادات الموقع في المتصفح لهذه الصفحة، واسمح بالوصول إلى الموقع، ثم حاول مرة أخرى. موقعك المحفوظ لم يتغير.',
    locationTimeout: 'لم نتمكن من تحديد موقعك في الوقت المحدد. حاول مرة أخرى بعد قليل. موقعك المحفوظ لم يتغير.',
    locationUnavailable: 'تعذّر تحديد موقعك على هذا الجهاز. موقعك المحفوظ لم يتغير.',
    privacy: 'نحفظ موقعًا تقريبيًا (بدقة نحو 100 متر) فقط لنجد العروض القريبة منك. لا يراه أي محل.',
    saveError: 'تعذّر الحفظ. تحقق من اتصالك وحاول مرة أخرى.',
    tooMany: 'غيّرت الإعدادات مرات كثيرة. حاول مرة أخرى بعد قليل.',
    compact: (n) => `العروض ضمن ${n} كم`,
    change: 'تغيير',
    emptyTitle: (n) => `لا توجد عروض ضمن ${n} كم`,
    emptyBody: 'وسّع المسافة لترى محلات أبعد قليلًا.',
    widen: (n) => `وسّع إلى ${n} كم`,
    widening: 'جارٍ التوسيع…',
  },
  en: {
    heading: 'Offers within',
    helper: 'Choose how far we look for offers around your saved location.',
    km: (n) => `${n} km`,
    saving: 'Saving…',
    saved: 'Saved',
    savedCardLater: 'Saved. Your Wallet card will update shortly.',
    updateLocation: 'Update my location',
    locating: 'Finding your location…',
    locationUpdated: 'Location updated',
    locationDenied:
      "Location access is off. Open your browser's site settings for this page, allow Location, then try again. Your saved location hasn't changed.",
    locationTimeout: "We couldn't find your location in time. Please try again in a moment. Your saved location hasn't changed.",
    locationUnavailable: "This device couldn't share a location. Your saved location hasn't changed.",
    privacy: 'We save an approximate location (to about 100 m) only to find offers near you. Shops never see it.',
    saveError: "Couldn't save. Check your connection and try again.",
    tooMany: "You've changed this many times. Please try again in a little while.",
    compact: (n) => `Offers within ${n} km`,
    change: 'Change',
    emptyTitle: (n) => `No offers within ${n} km`,
    emptyBody: 'Widen your area to see shops a little farther away.',
    widen: (n) => `Widen to ${n} km`,
    widening: 'Widening…',
  },
  ur: {
    heading: 'آفرز کا فاصلہ',
    helper: 'چنیں کہ آپ کے محفوظ مقام کے گرد کتنی دور تک آفرز تلاش کی جائیں۔',
    km: (n) => `${n} کلومیٹر`,
    saving: 'محفوظ ہو رہا ہے…',
    saved: 'محفوظ ہو گیا',
    savedCardLater: 'محفوظ ہو گیا۔ آپ کا والیٹ کارڈ جلد اپ ڈیٹ ہو جائے گا۔',
    updateLocation: 'میرا مقام اپ ڈیٹ کریں',
    locating: 'آپ کا مقام معلوم کیا جا رہا ہے…',
    locationUpdated: 'مقام اپ ڈیٹ ہو گیا',
    locationDenied:
      'لوکیشن کی اجازت بند ہے۔ اس صفحے کے لیے براؤزر کی سائٹ سیٹنگز کھولیں، لوکیشن کی اجازت دیں، پھر دوبارہ کوشش کریں۔ آپ کا محفوظ مقام نہیں بدلا۔',
    locationTimeout: 'مقررہ وقت میں آپ کا مقام معلوم نہیں ہو سکا۔ تھوڑی دیر بعد دوبارہ کوشش کریں۔ آپ کا محفوظ مقام نہیں بدلا۔',
    locationUnavailable: 'یہ ڈیوائس مقام نہیں بتا سکی۔ آپ کا محفوظ مقام نہیں بدلا۔',
    privacy: 'ہم صرف قریبی آفرز تلاش کرنے کے لیے تقریبی مقام (تقریباً 100 میٹر تک) محفوظ کرتے ہیں۔ دکانیں اسے کبھی نہیں دیکھتیں۔',
    saveError: 'محفوظ نہیں ہو سکا۔ کنکشن چیک کر کے دوبارہ کوشش کریں۔',
    tooMany: 'آپ نے کئی بار تبدیلی کی ہے۔ تھوڑی دیر بعد دوبارہ کوشش کریں۔',
    compact: (n) => `${n} کلومیٹر کے اندر آفرز`,
    change: 'تبدیل کریں',
    emptyTitle: (n) => `${n} کلومیٹر کے اندر کوئی آفر نہیں`,
    emptyBody: 'تھوڑی دور کی دکانیں دیکھنے کے لیے فاصلہ بڑھائیں۔',
    widen: (n) => `${n} کلومیٹر تک بڑھائیں`,
    widening: 'بڑھایا جا رہا ہے…',
  },
}

export const IOS_NOTICE_COPY: Record<Locale, { scan: string; landing: string }> = {
  ar: {
    scan: 'بطاقات جيران تعمل على هواتف أندرويد حاليًا، ودعم آيفون قادم قريبًا. ما زال بإمكانك رؤية عروض اليوم بالأسفل.',
    landing: 'بطاقات جيران تعمل على هواتف أندرويد حاليًا، ودعم آيفون قادم قريبًا. ما زال بإمكانك تصفح عروض اليوم.',
  },
  en: {
    scan: "Jeeran cards work on Android phones for now; iPhone is coming soon. You can still see today's offers below.",
    landing: "Jeeran cards work on Android phones for now; iPhone is coming soon. You can still browse today's offers.",
  },
  ur: {
    scan: 'جیران کارڈ فی الحال اینڈرائیڈ فونز پر چلتے ہیں؛ آئی فون جلد آ رہا ہے۔ آپ آج کی آفرز نیچے پھر بھی دیکھ سکتے ہیں۔',
    landing: 'جیران کارڈ فی الحال اینڈرائیڈ فونز پر چلتے ہیں؛ آئی فون جلد آ رہا ہے۔ آپ آج کی آفرز پھر بھی دیکھ سکتے ہیں۔',
  },
}
