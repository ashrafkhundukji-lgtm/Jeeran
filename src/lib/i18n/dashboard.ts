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
    errorNotAuthenticated: string
    errorFrozen: string
    errorNoBusiness: string
    errorTitleRequired: string
    errorBidRange: string
    errorAlreadyActiveCreate: string
    errorAlreadyActiveToggle: string
    errorCampaignNotFound: string
    imageLabel: string
    imageUploading: string
    imageRemove: string
    imageError: string
    translationsShow: string
    translationsHide: string
    translationsHint: string
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
    errorNotAuthenticated: string
    errorNoBusiness: string
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
    phone: string
    phonePlaceholder: string
    whatsapp: string
    whatsappPlaceholder: string
    contactHint: string
    save: string
    saving: string
    saved: string
    error: string
    language: string
    errorNotAuthenticated: string
    errorNoBusiness: string
    errorNameRequired: string
    errorBusinessRequired: string
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
  leaderboard: {
    heading: string
    subtitle: string
    weekTab: string
    monthTab: string
    newCustomers: string
    empty: string
    loading: string
    you: string
  }
  milestone: {
    reached: string
    dismiss: string
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
      errorNotAuthenticated: 'يجب تسجيل الدخول',
      errorFrozen: 'هذا الحساب مجمّد',
      errorNoBusiness: 'لم يتم العثور على محل مرتبط بهذا الحساب',
      errorTitleRequired: 'العنوان مطلوب',
      errorBidRange: 'يجب أن يكون السعر لكل مشاهدة بين 2 و10',
      errorAlreadyActiveCreate: 'لديك حملة نشطة بالفعل — أوقفها قبل إنشاء حملة جديدة.',
      errorAlreadyActiveToggle: 'لديك حملة نشطة أخرى بالفعل — أوقفها أولًا.',
      errorCampaignNotFound: 'الحملة غير موجودة',
      imageLabel: 'صورة العرض (اختياري)',
      imageUploading: 'جارٍ الرفع…',
      imageRemove: 'إزالة',
      imageError: 'تعذر رفع الصورة',
      translationsShow: '+ إضافة ترجمات (اختياري)',
      translationsHide: '- إخفاء الترجمات',
      translationsHint:
        'إذا تركتها فارغة، سيُترجم العرض تلقائياً. أدخل ترجمتك الخاصة هنا فقط إذا أردت التحكم الكامل بالنص.',
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
      errorNotAuthenticated: 'يجب تسجيل الدخول',
      errorNoBusiness: 'لم يتم العثور على حساب محل مرتبط بهذا المستخدم',
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
      phone: 'رقم الهاتف',
      phonePlaceholder: 'اختياري',
      whatsapp: 'واتساب',
      whatsappPlaceholder: 'اختياري',
      contactHint: 'تظهر للعملاء في صفحة العرض، بجانب زر الاتجاهات.',
      save: 'حفظ التغييرات',
      saving: 'جارٍ الحفظ…',
      saved: 'تم الحفظ.',
      error: 'حدث خطأ ما',
      language: 'اللغة',
      errorNotAuthenticated: 'يجب تسجيل الدخول',
      errorNoBusiness: 'لم يتم العثور على محل مرتبط بهذا الحساب',
      errorNameRequired: 'الاسم مطلوب',
      errorBusinessRequired: 'اسم المحل والفئة مطلوبان',
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
    leaderboard: {
      heading: 'المحلات الأكثر نشاطًا',
      subtitle: 'مرتبة حسب عملاء جدد حقيقيين فقط — لا يُحتسب عملاء العودة.',
      weekTab: 'هذا الأسبوع',
      monthTab: 'هذا الشهر',
      newCustomers: '{n} عميل جديد',
      empty: 'لا يوجد عملاء جدد بعد في هذه الفترة.',
      loading: 'جارٍ التحميل…',
      you: 'أنت',
    },
    milestone: {
      reached: 'وصلت إلى مستوى {tier}! تم منحك {n} نقاط إعلانية.',
      dismiss: 'حسنًا',
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
      errorNotAuthenticated: 'You must be signed in',
      errorFrozen: 'This account is frozen',
      errorNoBusiness: 'No business found for this account',
      errorTitleRequired: 'Title is required',
      errorBidRange: 'Bid per view must be between 2 and 10',
      errorAlreadyActiveCreate: 'You already have an active campaign — deactivate it before creating another.',
      errorAlreadyActiveToggle: 'You already have another active campaign — deactivate it first.',
      errorCampaignNotFound: 'Campaign not found',
      imageLabel: 'Offer photo (optional)',
      imageUploading: 'Uploading…',
      imageRemove: 'Remove',
      imageError: 'Could not upload image',
      translationsShow: '+ Add translations (optional)',
      translationsHide: '- Hide translations',
      translationsHint:
        "Left blank, the offer gets auto-translated. Only fill these in if you want full control over the wording.",
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
      errorNotAuthenticated: 'You must be signed in',
      errorNoBusiness: 'No business account found for this user',
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
      phone: 'Phone number',
      phonePlaceholder: 'Optional',
      whatsapp: 'WhatsApp',
      whatsappPlaceholder: 'Optional',
      contactHint: 'Shown to customers on the offer page, next to Get directions.',
      save: 'Save changes',
      saving: 'Saving…',
      saved: 'Saved.',
      error: 'Something went wrong',
      language: 'Language',
      errorNotAuthenticated: 'You must be signed in',
      errorNoBusiness: 'No business found for this account',
      errorNameRequired: 'Name is required',
      errorBusinessRequired: 'Business name and category are required',
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
    leaderboard: {
      heading: 'Most Active Shops',
      subtitle: 'Ranked by genuine new customers only — repeat visits don’t count.',
      weekTab: 'This week',
      monthTab: 'This month',
      newCustomers: '{n} new customers',
      empty: 'No new customers yet this period.',
      loading: 'Loading…',
      you: 'You',
    },
    milestone: {
      reached: "You've reached {tier}! +{n} ad credits awarded.",
      dismiss: 'Got it',
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
      errorNotAuthenticated: 'آپ کو سائن ان ہونا ضروری ہے',
      errorFrozen: 'یہ اکاؤنٹ منجمد ہے',
      errorNoBusiness: 'اس اکاؤنٹ کے لیے کوئی دکان نہیں ملی',
      errorTitleRequired: 'عنوان ضروری ہے',
      errorBidRange: 'فی ویو بولی 2 اور 10 کے درمیان ہونی چاہیے',
      errorAlreadyActiveCreate: 'آپ کے پاس پہلے سے ایک فعال کیمپین ہے — نیا بنانے سے پہلے اسے غیر فعال کریں۔',
      errorAlreadyActiveToggle: 'آپ کے پاس پہلے سے ایک اور فعال کیمپین ہے — پہلے اسے غیر فعال کریں۔',
      errorCampaignNotFound: 'کیمپین نہیں ملا',
      imageLabel: 'آفر کی تصویر (اختیاری)',
      imageUploading: 'اپ لوڈ ہو رہا ہے…',
      imageRemove: 'ہٹائیں',
      imageError: 'تصویر اپ لوڈ نہیں ہو سکی',
      translationsShow: '+ ترجمے شامل کریں (اختیاری)',
      translationsHide: '- ترجمے چھپائیں',
      translationsHint: 'خالی چھوڑنے پر آفر خودکار طور پر ترجمہ ہو جائے گا۔ الفاظ پر مکمل کنٹرول چاہیں تو ہی یہاں اپنا ترجمہ لکھیں۔',
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
      errorNotAuthenticated: 'آپ کو سائن ان ہونا ضروری ہے',
      errorNoBusiness: 'اس صارف کے لیے کوئی دکان اکاؤنٹ نہیں ملا',
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
      phone: 'فون نمبر',
      phonePlaceholder: 'اختیاری',
      whatsapp: 'واٹس ایپ',
      whatsappPlaceholder: 'اختیاری',
      contactHint: 'یہ آفر پیج پر گاہکوں کو راستے کے بٹن کے ساتھ دکھایا جاتا ہے۔',
      save: 'تبدیلیاں محفوظ کریں',
      saving: 'محفوظ ہو رہا ہے…',
      saved: 'محفوظ ہو گیا۔',
      error: 'کچھ غلط ہو گیا',
      language: 'زبان',
      errorNotAuthenticated: 'آپ کو سائن ان ہونا ضروری ہے',
      errorNoBusiness: 'اس اکاؤنٹ کے لیے کوئی دکان نہیں ملی',
      errorNameRequired: 'نام ضروری ہے',
      errorBusinessRequired: 'دکان کا نام اور کیٹگری ضروری ہیں',
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
    leaderboard: {
      heading: 'سب سے زیادہ فعال دکانیں',
      subtitle: 'صرف حقیقی نئے کسٹمرز کی بنیاد پر ترتیب دی گئی — دوبارہ آنے والے شمار نہیں ہوتے۔',
      weekTab: 'اس ہفتے',
      monthTab: 'اس مہینے',
      newCustomers: '{n} نئے کسٹمرز',
      empty: 'اس مدت میں ابھی تک کوئی نیا کسٹمر نہیں۔',
      loading: 'لوڈ ہو رہا ہے…',
      you: 'آپ',
    },
    milestone: {
      reached: 'آپ {tier} سطح پر پہنچ گئے! آپ کو {n} اشتہاری کریڈٹس ملے۔',
      dismiss: 'ٹھیک ہے',
    },
  },
}
