import type { Locale } from './locale'

export interface DashboardCopy {
  nav: {
    dashboard: string
    billing: string
    profile: string
    redeem: string
    signOut: string
  }
  owner: {
    adCredits: string
    scansHosted: string
    customersAcquired: string
    promotionCaption: string
    qrStandHeading: string
    qrStandBody: string
    downloadPdf: string
  }
  subscriptionBanner: {
    inactiveMessage: string
    noCreditsMessage: string
    manageBilling: string
  }
  campaigns: {
    heading: string
    newCampaign: string
    cancel: string
    titlePlaceholder: string
    descriptionPlaceholder: string
    bidPerView: string
    startDate: string
    endDate: string
    createButton: string
    creatingButton: string
    createError: string
    endDateError: string
    noCampaigns: string
    edit: string
    saveChanges: string
    savingChanges: string
    active: string
    inactive: string
    creditsPerView: string
    noStartDate: string
    noEndDate: string
    toggleError: string
  }
  billing: {
    heading: string
    subscriptionStatus: string
    active: string
    inactive: string
    credits: string
    history: string
    noActivity: string
    notConfigured: string
    subscribe: string
    redirecting: string
    buyCredits: string
    creditsSuffix: string
    checkoutError: string
    topupTransaction: string
    subscriptionStarted: string
    subscriptionRenewed: string
    adClaimed: string
    campaignFallback: string
  }
  profile: {
    heading: string
    subtitle: string
    email: string
    yourName: string
    businessName: string
    category: string
    location: string
    useMyLocation: string
    findingYou: string
    locationHint: string
    locationSet: string
    save: string
    saving: string
    saved: string
    error: string
    language: string
  }
  redeem: {
    heading: string
    subtitle: string
    startScan: string
    stopScan: string
    scanning: string
    cameraUnsupported: string
    cameraStartFailed: string
    manualHeading: string
    manualPlaceholder: string
    manualSubmit: string
    checking: string
    scanAnother: string
    resultSuccess: string
    errorNoActiveOffer: string
    errorAlreadyRedeemed: string
    errorPassInactive: string
    errorInvalidBarcode: string
    errorGeneric: string
  }
}

export const DASHBOARD_COPY: Record<Locale, DashboardCopy> = {
  ar: {
    nav: {
      dashboard: 'لوحة التحكم',
      billing: 'الفواتير',
      profile: 'الملف الشخصي',
      redeem: 'استبدال',
      signOut: 'تسجيل الخروج',
    },
    owner: {
      adCredits: 'نقاط الإعلان',
      scansHosted: 'عمليات المسح المستضافة',
      customersAcquired: 'العملاء المكتسبون',
      promotionCaption:
        '{n} عملية استبدال عبر جيران حتى الآن — المستويات الأعلى تظهر أولًا للعملاء القريبين في فئتك.',
      qrStandHeading: 'حامل رمز QR الخاص بك',
      qrStandBody: 'اطبع هذا وضعه في حامل الأكريليك.',
      downloadPdf: 'تحميل ملف PDF جاهز للطباعة',
    },
    subscriptionBanner: {
      inactiveMessage: 'اشتراكك غير نشط — لن تظهر حملاتك للعملاء القريبين.',
      noCreditsMessage: 'نفدت نقاط الإعلان لديك — لن تظهر حملاتك حتى تشحن رصيدك.',
      manageBilling: 'إدارة الفواتير',
    },
    campaigns: {
      heading: 'الحملات',
      newCampaign: '+ حملة جديدة',
      cancel: 'إلغاء',
      titlePlaceholder: 'العنوان',
      descriptionPlaceholder: 'الوصف',
      bidPerView: 'السعر لكل مشاهدة: {n} نقاط',
      startDate: 'تاريخ البدء',
      endDate: 'تاريخ الانتهاء',
      createButton: 'إنشاء الحملة',
      creatingButton: 'جارٍ الإنشاء…',
      createError: 'تعذر إنشاء الحملة',
      endDateError: 'يجب أن يكون تاريخ الانتهاء بعد تاريخ البدء أو يساويه',
      noCampaigns: 'لا توجد حملات بعد.',
      edit: 'تعديل',
      saveChanges: 'حفظ التغييرات',
      savingChanges: 'جارٍ الحفظ…',
      active: 'نشطة',
      inactive: 'غير نشطة',
      creditsPerView: '{n} نقاط/مشاهدة',
      noStartDate: 'بدون تاريخ بدء',
      noEndDate: 'بدون تاريخ انتهاء',
      toggleError: 'تعذر تحديث الحملة',
    },
    billing: {
      heading: 'الفواتير',
      subscriptionStatus: 'حالة الاشتراك',
      active: 'نشط',
      inactive: 'غير نشط',
      credits: 'النقاط',
      history: 'السجل',
      noActivity: 'لا يوجد نشاط بعد.',
      notConfigured: 'الفوترة غير مُعدة بعد.',
      subscribe: 'اشترك — ${n}/شهريًا',
      redirecting: 'جارٍ التحويل…',
      buyCredits: 'شراء نقاط',
      creditsSuffix: 'نقاط',
      checkoutError: 'تعذر بدء عملية الدفع',
      topupTransaction: 'شحن رصيد',
      subscriptionStarted: 'بدأ الاشتراك',
      subscriptionRenewed: 'تم تجديد الاشتراك',
      adClaimed: 'تم استبدال إعلان: {title}',
      campaignFallback: 'حملة',
    },
    profile: {
      heading: 'الملف الشخصي',
      subtitle: 'حدّث بيانات حسابك ومحلك.',
      email: 'البريد الإلكتروني',
      yourName: 'اسمك',
      businessName: 'اسم المحل',
      category: 'الفئة',
      location: 'الموقع',
      useMyLocation: 'استخدام موقعي الحالي',
      findingYou: 'جارٍ تحديد موقعك…',
      locationHint: 'اضغط على الخريطة لتثبيت دبوس على محلك، أو اسحبه لضبطه.',
      locationSet: '📍 تم تحديد الموقع',
      save: 'حفظ التغييرات',
      saving: 'جارٍ الحفظ…',
      saved: 'تم الحفظ.',
      error: 'حدث خطأ ما',
      language: 'اللغة',
    },
    redeem: {
      heading: 'استبدال العروض',
      subtitle: 'امسح رمز QR الخاص بالعميل من محفظته، أو أدخل الرمز يدويًا.',
      startScan: 'بدء المسح',
      stopScan: 'إيقاف المسح',
      scanning: 'جارٍ المسح…',
      cameraUnsupported: 'متصفحك لا يدعم المسح بالكاميرا. استخدم الإدخال اليدوي أدناه.',
      cameraStartFailed: 'تعذر تشغيل الكاميرا — تحقق من إذن الوصول للكاميرا، أو استخدم الإدخال اليدوي أدناه.',
      manualHeading: 'إدخال يدوي',
      manualPlaceholder: 'الصق أو اكتب رمز الباركود',
      manualSubmit: 'تحقق',
      checking: 'جارٍ التحقق…',
      scanAnother: 'مسح عميل آخر',
      resultSuccess: 'تم الاستبدال: {title}',
      errorNoActiveOffer: 'لا يوجد عرض نشط لهذا المحل حاليًا',
      errorAlreadyRedeemed: 'استبدل هذا العميل هذا العرض من قبل',
      errorPassInactive: 'لم تعد البطاقة نشطة — ربما أزالها العميل من محفظته',
      errorInvalidBarcode: 'رمز غير صالح أو تم التلاعب به',
      errorGeneric: 'تعذر التحقق من الرمز',
    },
  },
  en: {
    nav: {
      dashboard: 'Dashboard',
      billing: 'Billing',
      profile: 'Profile',
      redeem: 'Redeem',
      signOut: 'Sign out',
    },
    owner: {
      adCredits: 'Ad Credits',
      scansHosted: 'Scans Hosted',
      customersAcquired: 'Customers Acquired',
      promotionCaption:
        '{n} redemptions via Jeeran so far — higher levels get shown first to nearby customers in your category.',
      qrStandHeading: 'Your QR Stand',
      qrStandBody: 'Print this and slip it into your acrylic stand.',
      downloadPdf: 'Download Print-Ready PDF',
    },
    subscriptionBanner: {
      inactiveMessage: "Your subscription is inactive — your campaigns won't appear to nearby customers.",
      noCreditsMessage: "You're out of ad credits — your campaigns won't appear until you top up.",
      manageBilling: 'Manage billing',
    },
    campaigns: {
      heading: 'Campaigns',
      newCampaign: '+ New campaign',
      cancel: 'Cancel',
      titlePlaceholder: 'Title',
      descriptionPlaceholder: 'Description',
      bidPerView: 'Bid per view: {n} credits',
      startDate: 'Start date',
      endDate: 'End date',
      createButton: 'Create campaign',
      creatingButton: 'Creating…',
      createError: 'Could not create campaign',
      endDateError: 'End date must be on or after the start date',
      noCampaigns: 'No campaigns yet.',
      edit: 'Edit',
      saveChanges: 'Save changes',
      savingChanges: 'Saving…',
      active: 'Active',
      inactive: 'Inactive',
      creditsPerView: '{n} credits/view',
      noStartDate: 'No start date',
      noEndDate: 'No end date',
      toggleError: 'Could not update campaign',
    },
    billing: {
      heading: 'Billing',
      subscriptionStatus: 'Subscription status',
      active: 'Active',
      inactive: 'Inactive',
      credits: 'Credits',
      history: 'History',
      noActivity: 'No activity yet.',
      notConfigured: "Billing isn't configured yet.",
      subscribe: 'Subscribe — ${n}/mo',
      redirecting: 'Redirecting…',
      buyCredits: 'Buy Credits',
      creditsSuffix: 'credits',
      checkoutError: 'Could not start checkout',
      topupTransaction: 'Credit top-up',
      subscriptionStarted: 'Subscription started',
      subscriptionRenewed: 'Subscription renewed',
      adClaimed: 'Ad claimed: {title}',
      campaignFallback: 'campaign',
    },
    profile: {
      heading: 'Profile',
      subtitle: 'Update your account and shop details.',
      email: 'Email',
      yourName: 'Your name',
      businessName: 'Business name',
      category: 'Category',
      location: 'Location',
      useMyLocation: 'Use my current location',
      findingYou: 'Finding you…',
      locationHint: 'Tap the map to drop a pin on your shop, or drag it to adjust.',
      locationSet: '📍 Location set',
      save: 'Save changes',
      saving: 'Saving…',
      saved: 'Saved.',
      error: 'Something went wrong',
      language: 'Language',
    },
    redeem: {
      heading: 'Redeem Offers',
      subtitle: "Scan the customer's Wallet barcode, or enter the code manually.",
      startScan: 'Start scanning',
      stopScan: 'Stop scanning',
      scanning: 'Scanning…',
      cameraUnsupported: "Your browser doesn't support camera scanning. Use manual entry below.",
      cameraStartFailed: 'Could not start the camera — check camera permission, or use manual entry below.',
      manualHeading: 'Manual entry',
      manualPlaceholder: 'Paste or type the barcode value',
      manualSubmit: 'Check',
      checking: 'Checking…',
      scanAnother: 'Scan another customer',
      resultSuccess: 'Redeemed: {title}',
      errorNoActiveOffer: 'No active offer for this shop right now',
      errorAlreadyRedeemed: 'This customer already redeemed this offer',
      errorPassInactive: 'This pass is no longer active — the customer may have removed it from their wallet',
      errorInvalidBarcode: 'Invalid or tampered barcode',
      errorGeneric: 'Could not check this code',
    },
  },
  ur: {
    nav: {
      dashboard: 'ڈیش بورڈ',
      billing: 'بلنگ',
      profile: 'پروفائل',
      redeem: 'ریڈیم',
      signOut: 'سائن آؤٹ',
    },
    owner: {
      adCredits: 'اشتہاری کریڈٹس',
      scansHosted: 'میزبانی شدہ اسکینز',
      customersAcquired: 'حاصل شدہ کسٹمرز',
      promotionCaption:
        'اب تک جیران کے ذریعے {n} ریڈیمپشنز — اعلیٰ سطحیں آپ کی کیٹگری میں قریبی کسٹمرز کو پہلے دکھائی جاتی ہیں۔',
      qrStandHeading: 'آپ کا QR اسٹینڈ',
      qrStandBody: 'اسے پرنٹ کریں اور ایکریلک اسٹینڈ میں رکھیں۔',
      downloadPdf: 'پرنٹ کے لیے تیار PDF ڈاؤن لوڈ کریں',
    },
    subscriptionBanner: {
      inactiveMessage: 'آپ کی سبسکرپشن غیر فعال ہے — آپ کے کیمپینز قریبی کسٹمرز کو نظر نہیں آئیں گے۔',
      noCreditsMessage: 'آپ کے اشتہاری کریڈٹس ختم ہو چکے ہیں — ٹاپ اپ کرنے تک کیمپینز نظر نہیں آئیں گے۔',
      manageBilling: 'بلنگ کا انتظام کریں',
    },
    campaigns: {
      heading: 'کیمپینز',
      newCampaign: '+ نیا کیمپین',
      cancel: 'منسوخ کریں',
      titlePlaceholder: 'عنوان',
      descriptionPlaceholder: 'تفصیل',
      bidPerView: 'فی ویو بولی: {n} کریڈٹس',
      startDate: 'شروع کی تاریخ',
      endDate: 'ختم ہونے کی تاریخ',
      createButton: 'کیمپین بنائیں',
      creatingButton: 'بنایا جا رہا ہے…',
      createError: 'کیمپین نہیں بن سکا',
      endDateError: 'اختتامی تاریخ شروع کی تاریخ کے برابر یا بعد میں ہونی چاہیے',
      noCampaigns: 'ابھی تک کوئی کیمپین نہیں۔',
      edit: 'ترمیم کریں',
      saveChanges: 'تبدیلیاں محفوظ کریں',
      savingChanges: 'محفوظ ہو رہا ہے…',
      active: 'فعال',
      inactive: 'غیر فعال',
      creditsPerView: '{n} کریڈٹس/ویو',
      noStartDate: 'شروع کی تاریخ نہیں',
      noEndDate: 'اختتامی تاریخ نہیں',
      toggleError: 'کیمپین اپ ڈیٹ نہیں ہو سکا',
    },
    billing: {
      heading: 'بلنگ',
      subscriptionStatus: 'سبسکرپشن کی حیثیت',
      active: 'فعال',
      inactive: 'غیر فعال',
      credits: 'کریڈٹس',
      history: 'ہسٹری',
      noActivity: 'ابھی تک کوئی سرگرمی نہیں۔',
      notConfigured: 'بلنگ ابھی ترتیب نہیں دی گئی۔',
      subscribe: 'سبسکرائب کریں — ${n}/ماہانہ',
      redirecting: 'منتقل ہو رہا ہے…',
      buyCredits: 'کریڈٹس خریدیں',
      creditsSuffix: 'کریڈٹس',
      checkoutError: 'چیک آؤٹ شروع نہیں ہو سکا',
      topupTransaction: 'کریڈٹ ٹاپ اپ',
      subscriptionStarted: 'سبسکرپشن شروع ہوئی',
      subscriptionRenewed: 'سبسکرپشن تجدید ہوئی',
      adClaimed: 'اشتہار کلیم ہوا: {title}',
      campaignFallback: 'کیمپین',
    },
    profile: {
      heading: 'پروفائل',
      subtitle: 'اپنے اکاؤنٹ اور دکان کی تفصیلات اپ ڈیٹ کریں۔',
      email: 'ای میل',
      yourName: 'آپ کا نام',
      businessName: 'دکان کا نام',
      category: 'کیٹگری',
      location: 'مقام',
      useMyLocation: 'میرا موجودہ مقام استعمال کریں',
      findingYou: 'آپ کا مقام تلاش کیا جا رہا ہے…',
      locationHint: 'اپنی دکان پر پن لگانے کے لیے نقشے پر ٹیپ کریں، یا اسے ایڈجسٹ کرنے کے لیے گھسیٹیں۔',
      locationSet: '📍 مقام مقرر ہو گیا',
      save: 'تبدیلیاں محفوظ کریں',
      saving: 'محفوظ ہو رہا ہے…',
      saved: 'محفوظ ہو گیا۔',
      error: 'کچھ غلط ہو گیا',
      language: 'زبان',
    },
    redeem: {
      heading: 'آفرز ریڈیم کریں',
      subtitle: 'کسٹمر کے والٹ بارکوڈ کو اسکین کریں، یا کوڈ خود ٹائپ کریں۔',
      startScan: 'اسکین شروع کریں',
      stopScan: 'اسکین روکیں',
      scanning: 'اسکین ہو رہا ہے…',
      cameraUnsupported: 'آپ کا براؤزر کیمرہ اسکیننگ سپورٹ نہیں کرتا۔ نیچے دیا گیا مینوئل انٹری استعمال کریں۔',
      cameraStartFailed: 'کیمرہ شروع نہیں ہو سکا — کیمرہ کی اجازت چیک کریں، یا نیچے مینوئل انٹری استعمال کریں۔',
      manualHeading: 'مینوئل انٹری',
      manualPlaceholder: 'بارکوڈ ویلیو پیسٹ یا ٹائپ کریں',
      manualSubmit: 'چیک کریں',
      checking: 'چیک ہو رہا ہے…',
      scanAnother: 'دوسرا کسٹمر اسکین کریں',
      resultSuccess: 'ریڈیم ہو گیا: {title}',
      errorNoActiveOffer: 'اس دکان کے لیے فی الحال کوئی فعال آفر نہیں',
      errorAlreadyRedeemed: 'اس کسٹمر نے یہ آفر پہلے ہی ریڈیم کر لیا ہے',
      errorPassInactive: 'یہ پاس اب فعال نہیں ہے — ہو سکتا ہے کسٹمر نے اسے والٹ سے ہٹا دیا ہو',
      errorInvalidBarcode: 'غلط یا چھیڑ چھاڑ شدہ بارکوڈ',
      errorGeneric: 'اس کوڈ کو چیک نہیں کیا جا سکا',
    },
  },
}
