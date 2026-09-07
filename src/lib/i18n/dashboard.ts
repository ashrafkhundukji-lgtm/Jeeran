import type { Locale } from './locale'

export interface DashboardCopy {
  // Cross-cutting UI text shared across the owner cluster (e.g. OwnerAppBar's
  // subpage back button) that doesn't belong to any one screen's section.
  common: {
    back: string
  }
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
    // Mobile redesign additions (design_handoff_jeeran_mobile/README.md §1).
    creditsRunway: string // '{n}' views, '{bid}' credits/view
    topUpBalance: string
    activeOfferHeading: string
    previewAsCustomer: string
    // Short redemption-count clause for the title block's subtitle line
    // ('{category} · {n} redemptions via Jeeran') — promotionCaption above is
    // the older, longer two-clause version used elsewhere.
    redemptionCountShort: string
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
    instantNotifyLabel: string
    instantNotifyDescription: string
    instantNotifyActive: string
    instantNotifySubscribe: string
    addonStarted: string
    addonRenewed: string
    reachHeading: string
    reachDescription: string
    reachStandardLabel: string
    reachStandardDescription: string
    reachExtendedLabel: string
    reachExtendedDescription: string
    reachPremiumLabel: string
    reachPremiumDescription: string
    reachCurrentPlan: string
    reachSubscribe: string
    // Mobile redesign additions (README.md §4). bestValue is the
    // recommended-pack badge, computed at render time from credits-per-dollar
    // rather than a stored flag. todayLabel/yesterdayLabel head the ledger's
    // grouped-by-day sections; other days use a plain formatted date.
    bestValue: string
    todayLabel: string
    yesterdayLabel: string
    // The "/mo" in "${n}/mo" as a standalone fragment, for the status hero's
    // price line — the existing subscribe/reachSubscribe/instantNotifySubscribe
    // strings all bundle it into a full button label instead.
    perMonthSuffix: string
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
    // Mobile redesign additions (README.md §5) — sign-out moved into its own
    // confirm-before-acting card; categoryPicker/languagePicker head the new
    // sheet pickers for those two rows.
    signOutConfirm: string
    signOutConfirmYes: string
    categoryPicker: string
    languagePicker: string
    shopSectionLabel: string
    contactSectionLabel: string
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
    // Mobile redesign additions (README.md §2-3).
    aimHint: string
    manualEntrySubtitle: string
    torch: string
    customerLabel: string
    newCustomerFirstVisit: string
    returningCustomer: string
    redemptionsTodayLabel: string
    finish: string
    // Short status-line label ('تم الاستبدال') — resultSuccess above bundles
    // this with the offer title into one sentence, but the redesign's result
    // sheet shows the title separately at display size, so this needs to
    // stand alone.
    redeemedLabel: string
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
  // Restructured for the mobile redesign's 3-step flow (README.md §6) — was a
  // single flat heading/subtitle pair for the whole one-page form.
  onboarding: {
    step1Heading: string
    step1Subtitle: string
    step2Heading: string
    step2Subtitle: string
    step3Heading: string
    step3Subtitle: string
    stepCounter: string // '{n}' of 3
    continueButton: string
    yourName: string
    businessName: string
    category: string
    location: string
    useMyLocation: string
    findingYou: string
    locationHint: string
    locationSet: string
    error: string
    finishSetup: string
    savingSetup: string
  }
  frozen: {
    heading: string
    body: string
    contactSupport: string
    whatsappCta: string
    // Mobile redesign addition (README.md §7).
    reasonLabel: string
  }
}

export const DASHBOARD_COPY: Record<Locale, DashboardCopy> = {
  ar: {
    common: {
      back: 'رجوع',
    },
    nav: {
      dashboard: 'لوحة التحكم',
      billing: 'الفواتير',
      profile: 'الملف الشخصي',
      redeem: 'استبدال',
      signOut: 'تسجيل الخروج',
    },
    owner: {
      adCredits: 'نقاط الإعلان',
      scansHosted: 'عملية مسح مستضافة',
      customersAcquired: 'عميل مكتسب',
      promotionCaption:
        '{n} عملية استبدال عبر جيران حتى الآن — المستويات الأعلى تظهر أولًا للعملاء القريبين في فئتك.',
      qrStandHeading: 'حامل رمز QR الخاص بك',
      qrStandBody: 'جاهز للطباعة',
      downloadPdf: 'تحميل ملف PDF جاهز للطباعة',
      creditsRunway: 'تكفي لـ {n} مشاهدة عند {bid} نقاط/مشاهدة',
      topUpBalance: 'شحن الرصيد',
      activeOfferHeading: 'عرضك النشط',
      previewAsCustomer: 'معاينة كما يراها العميل',
      redemptionCountShort: '{n} عملية استبدال عبر جيران',
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
      instantNotifyLabel: 'الإشعار الفوري',
      instantNotifyDescription: 'يُرسل إشعار عرضك فور تفعيله أو تعديله، متجاوزاً الدفعة اليومية — ويحجز مكانه قبل العروض غير المشتركة.',
      instantNotifyActive: 'الإشعار الفوري مفعّل',
      instantNotifySubscribe: 'اشترك — ${n}/شهريًا',
      addonStarted: 'بدأ اشتراك الإضافة',
      addonRenewed: 'تم تجديد اشتراك الإضافة',
      reachHeading: 'خطة الوصول',
      reachDescription: 'إلى أي مدى خارج نطاق العميل يمكن أن تظل عروضك قابلة للاكتشاف.',
      reachStandardLabel: 'أساسي',
      reachStandardDescription: 'مُضمّن — بلا تعزيز',
      reachExtendedLabel: 'موسّع',
      reachExtendedDescription: 'يصل عرضك إلى العملاء ضمن 10 كم، حتى خارج نطاقهم المعتاد.',
      reachPremiumLabel: 'مميز',
      reachPremiumDescription: 'يصل عرضك إلى العملاء ضمن 25 كم — أقصى ظهور ممكن.',
      reachCurrentPlan: 'الخطة الحالية',
      reachSubscribe: 'اشترك — ${n}/شهريًا',
      bestValue: 'الأفضل قيمة',
      todayLabel: 'اليوم',
      yesterdayLabel: 'أمس',
      perMonthSuffix: 'شهريًا',
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
      locationSet: 'تم تحديد الموقع',
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
      signOutConfirm: 'تسجيل الخروج من الحساب؟',
      signOutConfirmYes: 'نعم، تسجيل الخروج',
      categoryPicker: 'اختر الفئة',
      languagePicker: 'اختر اللغة',
      shopSectionLabel: 'المحل',
      contactSectionLabel: 'التواصل',
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
      aimHint: 'وجّه الكاميرا نحو بطاقة العميل',
      manualEntrySubtitle: 'إذا كانت الكاميرا لا تعمل',
      torch: 'الفلاش',
      customerLabel: 'العميل',
      newCustomerFirstVisit: 'عميل جديد · أول زيارة',
      returningCustomer: 'عميل عائد',
      redemptionsTodayLabel: 'استبدالات اليوم',
      finish: 'إنهاء',
      redeemedLabel: 'تم الاستبدال',
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
    onboarding: {
      step1Heading: 'مرحبًا بك في شبكة جيران',
      step1Subtitle: 'أخبرنا قليلًا عن نفسك للبدء.',
      step2Heading: 'أين محلك؟',
      step2Subtitle: 'نستخدم الموقع لعرض عرضك على الجيران الأقرب إليك فقط.',
      step3Heading: 'ما نوع محلك؟',
      step3Subtitle: 'يساعدنا هذا في تصنيف محلك بين المحلات المشابهة القريبة منك.',
      stepCounter: '{n} / 3',
      continueButton: 'متابعة',
      yourName: 'اسمك',
      businessName: 'اسم المحل',
      category: 'الفئة',
      location: 'الموقع',
      useMyLocation: 'استخدام موقعي الحالي',
      findingYou: 'جارٍ تحديد موقعك…',
      locationHint: 'اضغط على الخريطة لتثبيت دبوس على محلك، أو اسحبه لضبطه.',
      locationSet: 'تم تحديد الموقع',
      error: 'حدث خطأ ما',
      finishSetup: 'إنهاء الإعداد',
      savingSetup: 'جارٍ الحفظ…',
    },
    frozen: {
      heading: 'الحساب مجمّد مؤقتًا',
      body: 'تم إيقاف حساب محلك مؤقتًا، ولن يظهر للعملاء أو يتمكن من تشغيل الحملات في الوقت الحالي.',
      contactSupport: 'تواصل مع الدعم لحل هذا الأمر.',
      whatsappCta: 'راسل الدعم عبر واتساب',
      reasonLabel: 'السبب',
    },
  },
  en: {
    common: {
      back: 'Back',
    },
    nav: {
      dashboard: 'Dashboard',
      billing: 'Billing',
      profile: 'Profile',
      redeem: 'Redeem',
      signOut: 'Sign out',
    },
    owner: {
      adCredits: 'Ad Credits',
      scansHosted: 'scan hosted',
      customersAcquired: 'customer acquired',
      promotionCaption:
        '{n} redemptions via Jeeran so far — higher levels get shown first to nearby customers in your category.',
      qrStandHeading: 'Your QR Stand',
      qrStandBody: 'Ready to print',
      downloadPdf: 'Download Print-Ready PDF',
      creditsRunway: 'Enough for {n} views at {bid} credits/view',
      topUpBalance: 'Top up',
      activeOfferHeading: 'Your active offer',
      previewAsCustomer: 'Preview as a customer sees it',
      redemptionCountShort: '{n} redemptions via Jeeran',
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
      instantNotifyLabel: 'Instant Notify',
      instantNotifyDescription:
        "Sends your offer's notification the moment it goes active or is edited, skipping the daily batch — and claims its slot ahead of non-premium offers.",
      instantNotifyActive: 'Instant Notify is active',
      instantNotifySubscribe: 'Subscribe — ${n}/mo',
      addonStarted: 'Add-on subscription started',
      addonRenewed: 'Add-on subscription renewed',
      reachHeading: 'Your reach plan',
      reachDescription: "How far outside a customer's own radius your offers can still be discovered.",
      reachStandardLabel: 'Standard',
      reachStandardDescription: 'Included — no boost',
      reachExtendedLabel: 'Extended',
      reachExtendedDescription: 'Reach customers up to 10 km away, even outside their own radius.',
      reachPremiumLabel: 'Premium',
      reachPremiumDescription: 'Reach customers up to 25 km away — maximum visibility.',
      reachCurrentPlan: 'Current plan',
      reachSubscribe: 'Subscribe — ${n}/mo',
      bestValue: 'Best value',
      todayLabel: 'Today',
      yesterdayLabel: 'Yesterday',
      perMonthSuffix: 'mo',
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
      locationSet: 'Location set',
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
      signOutConfirm: 'Sign out of your account?',
      signOutConfirmYes: 'Yes, sign out',
      categoryPicker: 'Choose a category',
      languagePicker: 'Choose a language',
      shopSectionLabel: 'Shop',
      contactSectionLabel: 'Contact',
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
      aimHint: 'Point the camera at the customer’s card',
      manualEntrySubtitle: "If the camera isn't working",
      torch: 'Flashlight',
      customerLabel: 'Customer',
      newCustomerFirstVisit: 'New customer · first visit',
      returningCustomer: 'Returning customer',
      redemptionsTodayLabel: "Today's redemptions",
      finish: 'Finish',
      redeemedLabel: 'Redeemed',
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
    onboarding: {
      step1Heading: 'Welcome to Jeeran Network',
      step1Subtitle: 'Tell us a bit about yourself to get started.',
      step2Heading: "Where's your shop?",
      step2Subtitle: "We use this to show your offer only to the neighbors closest to you.",
      step3Heading: 'What kind of shop is it?',
      step3Subtitle: 'This helps us group you with similar businesses nearby.',
      stepCounter: '{n} / 3',
      continueButton: 'Continue',
      yourName: 'Your name',
      businessName: 'Business name',
      category: 'Category',
      location: 'Location',
      useMyLocation: 'Use my current location',
      findingYou: 'Finding you…',
      locationHint: 'Tap the map to drop a pin on your shop, or drag it to adjust.',
      locationSet: 'Location set',
      error: 'Something went wrong',
      finishSetup: 'Finish setup',
      savingSetup: 'Saving…',
    },
    frozen: {
      heading: 'Account temporarily frozen',
      body: "Your shop account has been paused and isn't visible to customers or able to run campaigns right now.",
      contactSupport: 'Contact support to resolve this.',
      whatsappCta: 'Message support on WhatsApp',
      reasonLabel: 'Reason',
    },
  },
  ur: {
    common: {
      back: 'واپس',
    },
    nav: {
      dashboard: 'ڈیش بورڈ',
      billing: 'بلنگ',
      profile: 'پروفائل',
      redeem: 'ریڈیم',
      signOut: 'سائن آؤٹ',
    },
    owner: {
      adCredits: 'اشتہاری کریڈٹس',
      scansHosted: 'میزبانی شدہ اسکین',
      customersAcquired: 'حاصل شدہ کسٹمر',
      promotionCaption:
        'اب تک جیران کے ذریعے {n} ریڈیمپشنز — اعلیٰ سطحیں آپ کی کیٹگری میں قریبی کسٹمرز کو پہلے دکھائی جاتی ہیں۔',
      qrStandHeading: 'آپ کا QR اسٹینڈ',
      qrStandBody: 'پرنٹ کرنے کے لیے تیار',
      downloadPdf: 'پرنٹ کے لیے تیار PDF ڈاؤن لوڈ کریں',
      creditsRunway: '{bid} کریڈٹس/ویو پر {n} ویوز کے لیے کافی',
      topUpBalance: 'ٹاپ اپ کریں',
      activeOfferHeading: 'آپ کی فعال آفر',
      previewAsCustomer: 'کسٹمر کے نظریے سے دیکھیں',
      redemptionCountShort: 'جیران کے ذریعے {n} ریڈیمپشنز',
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
      instantNotifyLabel: 'فوری اطلاع',
      instantNotifyDescription: 'آپ کی آفر کی اطلاع فعال یا ترمیم ہوتے ہی فوراً بھیجی جاتی ہے، روزانہ بیچ کو نظرانداز کرتے ہوئے — اور غیر پریمیم آفرز سے پہلے سلاٹ محفوظ کر لیتی ہے۔',
      instantNotifyActive: 'فوری اطلاع فعال ہے',
      instantNotifySubscribe: 'سبسکرائب کریں — ${n}/ماہانہ',
      addonStarted: 'ایڈ آن سبسکرپشن شروع ہوئی',
      addonRenewed: 'ایڈ آن سبسکرپشن تجدید ہوئی',
      reachHeading: 'آپ کا ریچ پلان',
      reachDescription: 'آپ کی آفرز گاہک کے اپنے دائرے سے کتنی دور تک دریافت ہو سکتی ہیں۔',
      reachStandardLabel: 'اسٹینڈرڈ',
      reachStandardDescription: 'شامل — کوئی اضافہ نہیں',
      reachExtendedLabel: 'ایکسٹینڈڈ',
      reachExtendedDescription: '10 کلومیٹر دور تک گاہکوں تک رسائی، ان کے اپنے دائرے سے باہر بھی۔',
      reachPremiumLabel: 'پریمیم',
      reachPremiumDescription: '25 کلومیٹر دور تک گاہکوں تک رسائی — زیادہ سے زیادہ نمائش۔',
      reachCurrentPlan: 'موجودہ پلان',
      reachSubscribe: 'سبسکرائب کریں — ${n}/ماہانہ',
      bestValue: 'بہترین ویلیو',
      todayLabel: 'آج',
      yesterdayLabel: 'کل',
      perMonthSuffix: 'ماہانہ',
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
      locationSet: 'مقام مقرر ہو گیا',
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
      signOutConfirm: 'اپنے اکاؤنٹ سے سائن آؤٹ کریں؟',
      signOutConfirmYes: 'ہاں، سائن آؤٹ کریں',
      categoryPicker: 'کیٹگری منتخب کریں',
      languagePicker: 'زبان منتخب کریں',
      shopSectionLabel: 'دکان',
      contactSectionLabel: 'رابطہ',
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
      aimHint: 'کیمرہ کسٹمر کے کارڈ کی طرف رکھیں',
      manualEntrySubtitle: 'اگر کیمرہ کام نہیں کر رہا',
      torch: 'فلیش لائٹ',
      customerLabel: 'کسٹمر',
      newCustomerFirstVisit: 'نیا کسٹمر · پہلی وزٹ',
      returningCustomer: 'واپس آنے والا کسٹمر',
      redemptionsTodayLabel: 'آج کی ریڈیمپشنز',
      finish: 'ختم کریں',
      redeemedLabel: 'ریڈیم ہو گیا',
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
    onboarding: {
      step1Heading: 'جیران نیٹ ورک میں خوش آمدید',
      step1Subtitle: 'شروع کرنے کے لیے اپنے بارے میں کچھ بتائیں۔',
      step2Heading: 'آپ کی دکان کہاں ہے؟',
      step2Subtitle: 'ہم مقام کا استعمال صرف آپ کے قریب ترین ہمسایوں کو آپ کی آفر دکھانے کے لیے کرتے ہیں۔',
      step3Heading: 'آپ کی دکان کس قسم کی ہے؟',
      step3Subtitle: 'اس سے ہمیں آپ کو قریبی ملتی جلتی دکانوں کے ساتھ گروپ کرنے میں مدد ملتی ہے۔',
      stepCounter: '{n} / 3',
      continueButton: 'جاری رکھیں',
      yourName: 'آپ کا نام',
      businessName: 'دکان کا نام',
      category: 'کیٹگری',
      location: 'مقام',
      useMyLocation: 'میرا موجودہ مقام استعمال کریں',
      findingYou: 'آپ کا مقام تلاش کیا جا رہا ہے…',
      locationHint: 'اپنی دکان پر پن لگانے کے لیے نقشے پر ٹیپ کریں، یا اسے ایڈجسٹ کرنے کے لیے گھسیٹیں۔',
      locationSet: 'مقام مقرر ہو گیا',
      error: 'کچھ غلط ہو گیا',
      finishSetup: 'سیٹ اپ مکمل کریں',
      savingSetup: 'محفوظ ہو رہا ہے…',
    },
    frozen: {
      heading: 'اکاؤنٹ عارضی طور پر منجمد ہے',
      body: 'آپ کی دکان کا اکاؤنٹ روک دیا گیا ہے اور فی الحال گاہکوں کو نظر نہیں آتا اور نہ ہی کیمپینز چلا سکتا ہے۔',
      contactSupport: 'اسے حل کرنے کے لیے سپورٹ سے رابطہ کریں۔',
      whatsappCta: 'واٹس ایپ پر سپورٹ سے رابطہ کریں',
      reasonLabel: 'وجہ',
    },
  },
}
