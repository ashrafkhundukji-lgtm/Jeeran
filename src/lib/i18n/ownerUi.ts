import type { Locale } from './locale'

// Copy for the mobile-first owner dashboard refresh (navy/coral/cream system
// — docs/design/jeeran-shop-dashboard-mobile-first-prompt.md). Same
// Record<Locale, …> mechanism as DASHBOARD_COPY; kept in its own table so
// the older keys there (still used by onboarding/frozen/admin-adjacent
// screens) stay untouched. Templates use {n}-style placeholders filled with
// fill() below. Terminology: "رصيد إعلاني" / "ad credit" / "اشتہاری بیلنس"
// — never "نقاط".

export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in values ? String(values[k]) : m))
}

// Dates/numbers in the page language, but always Gregorian + Latin digits —
// every count elsewhere in the dashboard is a Latin-digit String(n), so a
// date picker in Arabic-Indic digits (or the Hijri calendar 'ar-SA' gives by
// default) would read inconsistently next to them.
export const INTL_LOCALE: Record<Locale, string> = {
  ar: 'ar-u-ca-gregory-nu-latn',
  en: 'en-GB',
  ur: 'ur-u-ca-gregory-nu-latn',
}

export interface OwnerUiCopy {
  common: {
    retry: string
    close: string
    cancel: string
    errorTitle: string
    errorBody: string
    dismiss: string
  }
  balance: {
    label: string
    chip: string // '{n}' — top-bar chip
    runway: string // {n} views, {bid}
    runwayNoOffer: string
    low: string
    empty: string
    topUp: string
    inactive: string
  }
  tier: {
    explain: string // a11y label on the badge button
    sheetTitle: string
    score: string // {n}
    next: string // {n} {tier}
    nextBonus: string // {n}
    top: string
    effect: string
    levelRow: string // {n}
    current: string
  }
  stats: {
    scansHosted: string
    customersAcquired: string
    thisWeek: string // {n}
    more: string // {n}
    less: string // {n}
    same: string
  }
  checklist: {
    title: string
    progress: string // {done} {total}
    logo: string
    details: string
    offer: string
    qr: string
  }
  offer: {
    activeHeading: string
    preview: string
    emptyTitle: string
    emptyBody: string
    create: string
    allHeading: string
    perView: string // {n}
    redemptions: string // {n}
    duplicate: string
    edit: string
    active: string
    inactive: string
    toggleLabel: string // {title}
    dates: string // {start} {end}
    from: string // {start}
    until: string // {end}
    newCampaign: string
  }
  qr: {
    heading: string
    body: string
    download: string
    share: string
    shareText: string // {name}
    preparing: string
    failed: string
  }
  install: {
    title: string
    body: string
    iosBody: string
    add: string
  }
  leaderboardRow: string
  form: {
    titleNew: string
    titleEdit: string
    titleDuplicate: string
    titleLabel: string
    titleHint: string
    descriptionLabel: string
    imageLabel: string
    imageAdd: string
    imageHelp: string
    imageReplace: string
    imageRemove: string
    imageUploading: string
    imageTooBig: string
    imageWrongType: string
    imageNetwork: string
    imageGeneric: string
    bidLabel: string
    bidValue: string // {n}
    bidLess: string
    bidMore: string
    bidExplain: string
    bidTier: string
    bidReach: string
    bidEstimate: string // {n} {balance}
    bidEstimateNone: string
    datesLabel: string
    start: string
    end: string
    noStart: string
    noEnd: string
    presetToday: string
    presetWeek: string
    presetMonth: string
    clear: string
    endError: string
    pickDate: string
    prevMonth: string
    nextMonth: string
    previewHeading: string
    previewNote: string
    translationsHeading: string
    translationsHint: string
    activeWarning: string
    create: string
    creating: string
    save: string
    saving: string
    discardTitle: string
    discardBody: string
    discard: string
    keepEditing: string
    required: string
  }
  redeem: {
    aim: string
    startCamera: string
    cameraIdle: string
    deniedTitle: string
    deniedBody: string
    unsupportedTitle: string
    torchOn: string
    torchOff: string
    manualHeading: string
    manualBody: string
    manualPlaceholder: string
    submit: string
    checking: string
    successTitle: string
    successBody: string
    alreadyTitle: string
    alreadyBody: string
    passTitle: string
    passBody: string
    invalidTitle: string
    invalidBody: string
    noOfferTitle: string
    noOfferBody: string
    frozenTitle: string
    networkTitle: string
    networkBody: string
    genericTitle: string
    scanNext: string
    activateOffer: string
    recentHeading: string
    recentEmpty: string
    newCustomer: string
    returningCustomer: string
    todayCount: string // {n}
  }
  profile: {
    identityHeading: string
    logo: string
    cover: string
    logoHelp: string
    coverHelp: string
    upload: string
    replace: string
    remove: string
    uploading: string
    uploaded: string
    removed: string
    tooBig: string
    wrongType: string
    network: string
    generic: string
    previewHeading: string
    previewCard: string
    previewSheet: string
    shopHeading: string
    contactHeading: string
    locationHeading: string
    languageHeading: string
    accountHeading: string
    coordsSaved: string // {lat} {lng}
    coordsUnsaved: string // {lat} {lng}
    coordsNone: string
    mapHint: string
    phoneHint: string
    phoneNotSaudi: string
    dirtyBar: string
    discard: string
    saved: string
  }
  billing: {
    subscriptionHeading: string
    packagesHeading: string
    packageCredits: string // {n}
    perCredit: string // {price}
    historyHeading: string
    emptyTitle: string
    emptyBody: string
    reachHeading: string
  }
  leaderboard: {
    emptyWeekTitle: string
    emptyMonthTitle: string
    emptyBody: string
    errorTitle: string
  }
}

export const OWNER_UI_COPY: Record<Locale, OwnerUiCopy> = {
  ar: {
    common: {
      retry: 'إعادة المحاولة',
      close: 'إغلاق',
      cancel: 'إلغاء',
      errorTitle: 'حدث خطأ',
      errorBody: 'تعذّر تحميل البيانات. تحقق من الاتصال وحاول مرة أخرى.',
      dismiss: 'إخفاء',
    },
    balance: {
      label: 'الرصيد الإعلاني',
      chip: '{n} رصيد',
      runway: 'يكفي لـ {n} مشاهدة بسعر {bid} للمشاهدة',
      runwayNoOffer: 'أنشئ عرضًا لتعرف كم مشاهدة يكفيها رصيدك.',
      low: 'رصيدك منخفض — يكفي لأقل من 10 مشاهدات.',
      empty: 'نفد رصيدك — لن يظهر عرضك حتى تشحن.',
      topUp: 'شحن الرصيد',
      inactive: 'اشتراكك غير نشط — لن تظهر عروضك للعملاء القريبين.',
    },
    tier: {
      explain: 'ما معنى المستوى؟',
      sheetTitle: 'مستوى محلك',
      score: 'يُحسب مستواك من عدد مرات استبدال عروضك عبر جيران: {n} حتى الآن.',
      next: 'تحتاج إلى {n} من عمليات الاستبدال الإضافية للوصول إلى مستوى {tier}.',
      nextBonus: 'عند الوصول تحصل على مكافأة {n} من الرصيد الإعلاني مرة واحدة.',
      top: 'وصلت إلى أعلى مستوى.',
      effect: 'عندما تتقارب أسعار المشاهدة بين العروض القريبة من العميل، يظهر عرض المحل ذي المستوى الأعلى أولًا.',
      levelRow: 'من {n} عملية استبدال',
      current: 'مستواك',
    },
    stats: {
      scansHosted: 'عمليات مسح في محلك',
      customersAcquired: 'عملاء جدد لعروضك',
      thisWeek: 'هذا الأسبوع: {n}',
      more: '{n} أكثر من الأسبوع الماضي',
      less: '{n} أقل من الأسبوع الماضي',
      same: 'مثل الأسبوع الماضي',
    },
    checklist: {
      title: 'أكمل محلك',
      progress: '{done} من {total}',
      logo: 'أضف شعار المحل',
      details: 'أضف رقم التواصل وموقع المحل',
      offer: 'أنشئ أول عرض',
      qr: 'اطبع ملصق QR',
    },
    offer: {
      activeHeading: 'عرضك النشط',
      preview: 'معاينة كما يراه العميل',
      emptyTitle: 'لا يوجد عرض نشط',
      emptyBody: 'العملاء القريبون لا يرون محلك الآن. أنشئ عرضًا ليظهر لهم.',
      create: 'إنشاء عرض',
      allHeading: 'كل العروض',
      perView: '{n} للمشاهدة',
      redemptions: 'الاستبدالات: {n}',
      duplicate: 'نسخ',
      edit: 'تعديل',
      active: 'نشط',
      inactive: 'متوقف',
      toggleLabel: 'تفعيل العرض: {title}',
      dates: '{start} – {end}',
      from: 'من {start}',
      until: 'حتى {end}',
      newCampaign: 'عرض جديد',
    },
    qr: {
      heading: 'ملصق QR لمحلك',
      body: 'اطبعه وضعه عند الكاشير. يمسحه العملاء ليشاهدوا عروضك وعروض جيرانك.',
      download: 'تحميل PDF',
      share: 'مشاركة',
      shareText: 'ملصق QR لمحل {name} — جاهز للطباعة',
      preparing: 'جارٍ التجهيز…',
      failed: 'تعذّر تجهيز الملف. حاول مرة أخرى.',
    },
    install: {
      title: 'أضف لوحة التحكم إلى الشاشة الرئيسية',
      body: 'افتحها بلمسة واحدة كل يوم.',
      iosBody: 'اضغط زر المشاركة ثم «إضافة إلى الشاشة الرئيسية».',
      add: 'إضافة',
    },
    leaderboardRow: 'أنشط المحلات',
    form: {
      titleNew: 'عرض جديد',
      titleEdit: 'تعديل العرض',
      titleDuplicate: 'نسخة من عرض',
      titleLabel: 'عنوان العرض',
      titleHint: 'مثال: خصم 20% على القهوة',
      descriptionLabel: 'التفاصيل (اختياري)',
      imageLabel: 'صورة العرض (اختياري)',
      imageAdd: 'إضافة صورة',
      imageHelp: 'التقط صورة أو اخترها من المعرض. JPG أو PNG أو WebP، ونصغّرها تلقائيًا.',
      imageReplace: 'تغيير',
      imageRemove: 'إزالة',
      imageUploading: 'جارٍ الرفع…',
      imageTooBig: 'الصورة كبيرة جدًا حتى بعد التصغير. اختر صورة أصغر.',
      imageWrongType: 'هذا الملف ليس صورة مدعومة. استخدم JPG أو PNG أو WebP.',
      imageNetwork: 'انقطع الاتصال أثناء الرفع. حاول مرة أخرى.',
      imageGeneric: 'تعذّر رفع الصورة.',
      bidLabel: 'السعر لكل مشاهدة',
      bidValue: '{n} من الرصيد',
      bidLess: 'أقل ظهورًا',
      bidMore: 'أعلى ظهورًا',
      bidExplain: 'كلما رفعت السعر، ظهر عرضك أعلى في قائمة العروض القريبة من العميل.',
      bidTier: 'عند تقارب الأسعار، يتقدّم المحل ذو المستوى الأعلى.',
      bidReach: 'السعر لا يوسّع المسافة التي يصل إليها عرضك — ذلك عبر باقة «مدى الوصول» في صفحة الرصيد.',
      bidEstimate: 'رصيدك ({balance}) يكفي لـ {n} مشاهدة بهذا السعر.',
      bidEstimateNone: 'رصيدك لا يكفي لمشاهدة واحدة بهذا السعر — اشحن رصيدك.',
      datesLabel: 'مدة العرض',
      start: 'يبدأ',
      end: 'ينتهي',
      noStart: 'من الآن',
      noEnd: 'بدون نهاية',
      presetToday: 'اليوم فقط',
      presetWeek: 'أسبوع',
      presetMonth: 'شهر',
      clear: 'مسح',
      endError: 'يجب أن يكون تاريخ الانتهاء بعد تاريخ البدء أو في نفس اليوم.',
      pickDate: 'اختر التاريخ',
      prevMonth: 'الشهر السابق',
      nextMonth: 'الشهر التالي',
      previewHeading: 'كيف سيراه العملاء',
      previewNote: 'معاينة مباشرة تتحدّث أثناء الكتابة.',
      translationsHeading: 'ترجمات (اختياري)',
      translationsHint: 'إذا تركتها فارغة، يُترجم العرض تلقائيًا. أدخل ترجمتك فقط إذا أردت التحكم الكامل بالنص.',
      activeWarning: 'لديك عرض نشط الآن. أوقفه أولًا من الصفحة الرئيسية، ثم أنشئ العرض الجديد.',
      create: 'إنشاء العرض',
      creating: 'جارٍ الإنشاء…',
      save: 'حفظ التغييرات',
      saving: 'جارٍ الحفظ…',
      discardTitle: 'تجاهل ما أدخلته؟',
      discardBody: 'لن يتم حفظ هذا العرض.',
      discard: 'تجاهل',
      keepEditing: 'متابعة التعديل',
      required: 'العنوان مطلوب',
    },
    redeem: {
      aim: 'وجّه الكاميرا نحو رمز QR في بطاقة العميل',
      startCamera: 'تشغيل الكاميرا',
      cameraIdle: 'الكاميرا متوقفة',
      deniedTitle: 'لا يمكن الوصول إلى الكاميرا',
      deniedBody: 'اسمح للمتصفح باستخدام الكاميرا: اضغط رمز القفل بجانب عنوان الصفحة ← الأذونات ← الكاميرا ← سماح، ثم اضغط إعادة المحاولة.',
      unsupportedTitle: 'هذا المتصفح لا يدعم الكاميرا — استخدم الإدخال اليدوي.',
      torchOn: 'تشغيل الفلاش',
      torchOff: 'إطفاء الفلاش',
      manualHeading: 'إدخال الرمز يدويًا',
      manualBody: 'إذا لم تعمل الكاميرا، الصق رمز البطاقة هنا.',
      manualPlaceholder: 'رمز البطاقة',
      submit: 'تحقق',
      checking: 'جارٍ التحقق…',
      successTitle: 'تم الاستبدال',
      successBody: 'قدّم العرض للعميل.',
      alreadyTitle: 'مستخدم من قبل',
      alreadyBody: 'هذا العميل استبدل هذا العرض سابقًا.',
      passTitle: 'البطاقة لم تعد مفعّلة',
      passBody: 'حذف العميل البطاقة من محفظته. يمكنه إضافتها من جديد بمسح ملصق QR.',
      invalidTitle: 'رمز غير صالح',
      invalidBody: 'هذه ليست بطاقة جيران صالحة. اطلب من العميل فتح بطاقته وحاول مرة أخرى.',
      noOfferTitle: 'لا يوجد عرض نشط لمحلك',
      noOfferBody: 'فعّل عرضًا لتتمكن من الاستبدال.',
      frozenTitle: 'هذا الحساب مجمّد',
      networkTitle: 'تعذّر الاتصال',
      networkBody: 'تحقق من الإنترنت وحاول مرة أخرى.',
      genericTitle: 'تعذّر الاستبدال',
      scanNext: 'مسح العميل التالي',
      activateOffer: 'تفعيل عرض',
      recentHeading: 'آخر الاستبدالات',
      recentEmpty: 'لا توجد استبدالات بعد.',
      newCustomer: 'عميل جديد',
      returningCustomer: 'عميل عائد',
      todayCount: 'الاستبدال رقم {n} اليوم',
    },
    profile: {
      identityHeading: 'هوية المحل',
      logo: 'الشعار',
      cover: 'صورة الغلاف (اختياري)',
      logoHelp: 'صورة مربعة، 512×512 بكسل أو أكبر. PNG أو JPG أو WebP حتى 2 ميغابايت.',
      coverHelp: 'صورة عريضة 16:9، بعرض 1200 بكسل. PNG أو JPG أو WebP حتى 2 ميغابايت.',
      upload: 'رفع صورة',
      replace: 'تغيير',
      remove: 'إزالة',
      uploading: 'جارٍ الرفع…',
      uploaded: 'تم الحفظ',
      removed: 'تمت الإزالة',
      tooBig: 'الصورة أكبر من 2 ميغابايت.',
      wrongType: 'نوع الملف غير مدعوم. استخدم PNG أو JPG أو WebP.',
      network: 'انقطع الاتصال. حاول مرة أخرى.',
      generic: 'تعذّر حفظ الصورة.',
      previewHeading: 'كيف يظهر محلك',
      previewCard: 'في بطاقة العرض',
      previewSheet: 'في ملصق QR',
      shopHeading: 'المحل',
      contactHeading: 'التواصل',
      locationHeading: 'الموقع',
      languageHeading: 'اللغة',
      accountHeading: 'الحساب',
      coordsSaved: 'الموقع محفوظ: {lat}، {lng}',
      coordsUnsaved: 'موقع جديد ({lat}، {lng}) — احفظ لتطبيقه',
      coordsNone: 'لم يُحدَّد الموقع بعد.',
      mapHint: 'اضغط على الخريطة أو اسحب الدبوس لتحديد مدخل المحل.',
      phoneHint: 'مثال: ‎+966 5X XXX XXXX',
      phoneNotSaudi: 'هذا ليس رقمًا سعوديًا بالصيغة المعتادة — تأكد منه (يمكنك الحفظ).',
      dirtyBar: 'لديك تغييرات غير محفوظة',
      discard: 'تراجع',
      saved: 'تم حفظ التغييرات',
    },
    billing: {
      subscriptionHeading: 'الاشتراك',
      packagesHeading: 'باقات الرصيد الإعلاني',
      packageCredits: '{n} رصيد إعلاني',
      perCredit: '{price} لكل 100',
      historyHeading: 'السجل',
      emptyTitle: 'لا توجد حركات بعد',
      emptyBody: 'ستظهر هنا عمليات الشحن والاشتراك والخصم من رصيدك.',
      reachHeading: 'مدى الوصول',
    },
    leaderboard: {
      emptyWeekTitle: 'لا يوجد عملاء جدد بعد هذا الأسبوع',
      emptyMonthTitle: 'لا يوجد عملاء جدد بعد هذا الشهر',
      emptyBody: 'عندما يمسح عملاء جدد ملصق QR في أي محل، يظهر المحل هنا. اطبع ملصقك وضعه عند الكاشير.',
      errorTitle: 'تعذّر تحميل القائمة',
    },
  },
  en: {
    common: {
      retry: 'Try again',
      close: 'Close',
      cancel: 'Cancel',
      errorTitle: 'Something went wrong',
      errorBody: "We couldn't load this. Check your connection and try again.",
      dismiss: 'Dismiss',
    },
    balance: {
      label: 'Ad credit',
      chip: '{n} credit',
      runway: 'Enough for {n} views at {bid} per view',
      runwayNoOffer: 'Create an offer to see how many views your credit covers.',
      low: 'Low credit — covers fewer than 10 views.',
      empty: "You're out of credit — your offer won't show until you top up.",
      topUp: 'Top up',
      inactive: "Your subscription is inactive — nearby customers won't see your offers.",
    },
    tier: {
      explain: 'What does this tier mean?',
      sheetTitle: "Your shop's tier",
      score: 'Your tier is based on how many times your offers were redeemed through Jeeran: {n} so far.',
      next: '{n} more redemptions to reach {tier}.',
      nextBonus: "When you get there you'll receive a one-time bonus of {n} ad credit.",
      top: "You've reached the top tier.",
      effect: "When nearby offers have similar prices per view, the shop with the higher tier is shown first.",
      levelRow: '{n}+ redemptions',
      current: 'You',
    },
    stats: {
      scansHosted: 'Scans hosted',
      customersAcquired: 'Customers acquired',
      thisWeek: 'This week: {n}',
      more: '{n} more than last week',
      less: '{n} fewer than last week',
      same: 'Same as last week',
    },
    checklist: {
      title: 'Complete your shop',
      progress: '{done} of {total}',
      logo: 'Add your shop logo',
      details: 'Add contact number and location',
      offer: 'Create your first offer',
      qr: 'Print your QR sheet',
    },
    offer: {
      activeHeading: 'Your active offer',
      preview: 'Preview as a customer',
      emptyTitle: 'No active offer',
      emptyBody: "Nearby customers can't see your shop right now. Create an offer so it shows up.",
      create: 'Create offer',
      allHeading: 'All offers',
      perView: '{n} per view',
      redemptions: '{n} redeemed',
      duplicate: 'Duplicate',
      edit: 'Edit',
      active: 'Active',
      inactive: 'Paused',
      toggleLabel: 'Offer active: {title}',
      dates: '{start} – {end}',
      from: 'From {start}',
      until: 'Until {end}',
      newCampaign: 'New offer',
    },
    qr: {
      heading: 'Your QR sheet',
      body: 'Print it and place it at the counter. Customers scan it to see your offers and your neighbours’.',
      download: 'Download PDF',
      share: 'Share',
      shareText: 'QR sheet for {name} — ready to print',
      preparing: 'Preparing…',
      failed: "Couldn't prepare the file. Try again.",
    },
    install: {
      title: 'Add the dashboard to your home screen',
      body: 'Open it with one tap every day.',
      iosBody: 'Tap Share, then “Add to Home Screen”.',
      add: 'Add',
    },
    leaderboardRow: 'Most active shops',
    form: {
      titleNew: 'New offer',
      titleEdit: 'Edit offer',
      titleDuplicate: 'Copy of an offer',
      titleLabel: 'Offer title',
      titleHint: 'e.g. 20% off all coffee',
      descriptionLabel: 'Details (optional)',
      imageLabel: 'Offer photo (optional)',
      imageAdd: 'Add photo',
      imageHelp: 'Take a photo or pick one from your gallery. JPG, PNG or WebP — we resize it for you.',
      imageReplace: 'Replace',
      imageRemove: 'Remove',
      imageUploading: 'Uploading…',
      imageTooBig: 'This photo is still too large after resizing. Pick a smaller one.',
      imageWrongType: "This file isn't a supported image. Use JPG, PNG or WebP.",
      imageNetwork: 'The connection dropped while uploading. Try again.',
      imageGeneric: "Couldn't upload the photo.",
      bidLabel: 'Price per view',
      bidValue: '{n} credit',
      bidLess: 'Lower in the list',
      bidMore: 'Higher in the list',
      bidExplain: "The higher the price, the higher your offer appears in a customer's list of nearby offers.",
      bidTier: 'When prices are close, the shop with the higher tier goes first.',
      bidReach: "Price does not widen how far your offer reaches — that's the Reach add-on on the Billing page.",
      bidEstimate: 'Your credit ({balance}) covers {n} views at this price.',
      bidEstimateNone: "Your credit doesn't cover a single view at this price — top up first.",
      datesLabel: 'Offer dates',
      start: 'Starts',
      end: 'Ends',
      noStart: 'Now',
      noEnd: 'No end date',
      presetToday: 'Today only',
      presetWeek: '1 week',
      presetMonth: '1 month',
      clear: 'Clear',
      endError: 'The end date must be on or after the start date.',
      pickDate: 'Pick a date',
      prevMonth: 'Previous month',
      nextMonth: 'Next month',
      previewHeading: 'How customers will see it',
      previewNote: 'Live preview — updates as you type.',
      translationsHeading: 'Translations (optional)',
      translationsHint: "Leave blank and we'll translate it automatically. Only fill these in if you want full control of the wording.",
      activeWarning: 'You already have an active offer. Pause it from the home page first, then create the new one.',
      create: 'Create offer',
      creating: 'Creating…',
      save: 'Save changes',
      saving: 'Saving…',
      discardTitle: 'Discard this offer?',
      discardBody: "What you've entered won't be saved.",
      discard: 'Discard',
      keepEditing: 'Keep editing',
      required: 'A title is required',
    },
    redeem: {
      aim: "Point the camera at the QR code on the customer's card",
      startCamera: 'Turn on camera',
      cameraIdle: 'Camera is off',
      deniedTitle: "Can't access the camera",
      deniedBody: 'Allow camera access: tap the lock icon next to the address bar → Permissions → Camera → Allow, then tap Try again.',
      unsupportedTitle: "This browser can't use the camera — use manual entry below.",
      torchOn: 'Turn on flashlight',
      torchOff: 'Turn off flashlight',
      manualHeading: 'Enter the code manually',
      manualBody: "If the camera isn't working, paste the card code here.",
      manualPlaceholder: 'Card code',
      submit: 'Check',
      checking: 'Checking…',
      successTitle: 'Redeemed',
      successBody: 'Give the customer their offer.',
      alreadyTitle: 'Already used',
      alreadyBody: 'This customer has already redeemed this offer.',
      passTitle: 'Card no longer active',
      passBody: 'The customer removed the card from their wallet. They can add it again by scanning your QR sheet.',
      invalidTitle: 'Invalid code',
      invalidBody: "This isn't a valid Jeeran card. Ask the customer to open their card and try again.",
      noOfferTitle: 'Your shop has no active offer',
      noOfferBody: 'Turn on an offer to start redeeming.',
      frozenTitle: 'This account is frozen',
      networkTitle: "Couldn't connect",
      networkBody: 'Check your internet connection and try again.',
      genericTitle: "Couldn't redeem",
      scanNext: 'Scan next customer',
      activateOffer: 'Turn on an offer',
      recentHeading: 'Recent redemptions',
      recentEmpty: 'No redemptions yet.',
      newCustomer: 'New customer',
      returningCustomer: 'Returning customer',
      todayCount: 'Redemption #{n} today',
    },
    profile: {
      identityHeading: 'Shop identity',
      logo: 'Logo',
      cover: 'Cover photo (optional)',
      logoHelp: 'Square image, 512×512 px or larger. PNG, JPG or WebP, up to 2 MB.',
      coverHelp: 'Wide 16:9 image, 1200 px wide. PNG, JPG or WebP, up to 2 MB.',
      upload: 'Upload image',
      replace: 'Replace',
      remove: 'Remove',
      uploading: 'Uploading…',
      uploaded: 'Saved',
      removed: 'Removed',
      tooBig: 'The image is larger than 2 MB.',
      wrongType: 'Unsupported file. Use PNG, JPG or WebP.',
      network: 'The connection dropped. Try again.',
      generic: "Couldn't save the image.",
      previewHeading: 'How your shop appears',
      previewCard: 'On an offer card',
      previewSheet: 'On your QR sheet',
      shopHeading: 'Shop',
      contactHeading: 'Contact',
      locationHeading: 'Location',
      languageHeading: 'Language',
      accountHeading: 'Account',
      coordsSaved: 'Location saved: {lat}, {lng}',
      coordsUnsaved: 'New location ({lat}, {lng}) — save to apply',
      coordsNone: 'No location set yet.',
      mapHint: 'Tap the map or drag the pin to mark your shop entrance.',
      phoneHint: 'e.g. +966 5X XXX XXXX',
      phoneNotSaudi: "This doesn't look like a Saudi number — double-check it (you can still save).",
      dirtyBar: 'You have unsaved changes',
      discard: 'Undo',
      saved: 'Changes saved',
    },
    billing: {
      subscriptionHeading: 'Subscription',
      packagesHeading: 'Ad credit packages',
      packageCredits: '{n} ad credit',
      perCredit: '{price} per 100',
      historyHeading: 'History',
      emptyTitle: 'No activity yet',
      emptyBody: 'Top-ups, subscription payments and credit spent on your offers will show up here.',
      reachHeading: 'Reach',
    },
    leaderboard: {
      emptyWeekTitle: 'No new customers yet this week',
      emptyMonthTitle: 'No new customers yet this month',
      emptyBody: 'When new customers scan a QR sheet at any shop, that shop shows up here. Print yours and place it at the counter.',
      errorTitle: "Couldn't load the list",
    },
  },
  ur: {
    common: {
      retry: 'دوبارہ کوشش کریں',
      close: 'بند کریں',
      cancel: 'منسوخ',
      errorTitle: 'کچھ غلط ہو گیا',
      errorBody: 'ڈیٹا لوڈ نہیں ہو سکا۔ کنکشن چیک کر کے دوبارہ کوشش کریں۔',
      dismiss: 'چھپائیں',
    },
    balance: {
      label: 'اشتہاری بیلنس',
      chip: '{n} بیلنس',
      runway: '{bid} فی ویو کے حساب سے {n} ویوز کے لیے کافی',
      runwayNoOffer: 'آفر بنائیں تاکہ معلوم ہو آپ کا بیلنس کتنے ویوز کے لیے کافی ہے۔',
      low: 'بیلنس کم ہے — 10 سے کم ویوز کے لیے کافی۔',
      empty: 'بیلنس ختم ہو گیا — ٹاپ اپ کرنے تک آپ کی آفر نظر نہیں آئے گی۔',
      topUp: 'بیلنس ٹاپ اپ کریں',
      inactive: 'آپ کی سبسکرپشن غیر فعال ہے — قریبی گاہک آپ کی آفرز نہیں دیکھیں گے۔',
    },
    tier: {
      explain: 'اس درجے کا کیا مطلب ہے؟',
      sheetTitle: 'آپ کی دکان کا درجہ',
      score: 'آپ کا درجہ اس بات پر ہے کہ آپ کی آفرز جیران کے ذریعے کتنی بار ریڈیم ہوئیں: اب تک {n}۔',
      next: '{tier} تک پہنچنے کے لیے مزید {n} ریڈیمپشنز۔',
      nextBonus: 'وہاں پہنچنے پر آپ کو ایک بار {n} اشتہاری بیلنس کا بونس ملے گا۔',
      top: 'آپ سب سے اونچے درجے پر ہیں۔',
      effect: 'جب قریبی آفرز کی فی ویو قیمت ملتی جلتی ہو تو اونچے درجے والی دکان پہلے دکھائی جاتی ہے۔',
      levelRow: '{n}+ ریڈیمپشنز',
      current: 'آپ',
    },
    stats: {
      scansHosted: 'آپ کی دکان پر اسکین',
      customersAcquired: 'حاصل کردہ گاہک',
      thisWeek: 'اس ہفتے: {n}',
      more: 'پچھلے ہفتے سے {n} زیادہ',
      less: 'پچھلے ہفتے سے {n} کم',
      same: 'پچھلے ہفتے جتنے',
    },
    checklist: {
      title: 'اپنی دکان مکمل کریں',
      progress: '{total} میں سے {done}',
      logo: 'دکان کا لوگو شامل کریں',
      details: 'رابطہ نمبر اور مقام شامل کریں',
      offer: 'اپنی پہلی آفر بنائیں',
      qr: 'QR شیٹ پرنٹ کریں',
    },
    offer: {
      activeHeading: 'آپ کی فعال آفر',
      preview: 'گاہک کی نظر سے دیکھیں',
      emptyTitle: 'کوئی فعال آفر نہیں',
      emptyBody: 'قریبی گاہک ابھی آپ کی دکان نہیں دیکھ سکتے۔ آفر بنائیں تاکہ یہ ان کو نظر آئے۔',
      create: 'آفر بنائیں',
      allHeading: 'تمام آفرز',
      perView: '{n} فی ویو',
      redemptions: '{n} ریڈیم',
      duplicate: 'نقل بنائیں',
      edit: 'ترمیم',
      active: 'فعال',
      inactive: 'روکی گئی',
      toggleLabel: 'آفر فعال: {title}',
      dates: '{start} – {end}',
      from: '{start} سے',
      until: '{end} تک',
      newCampaign: 'نئی آفر',
    },
    qr: {
      heading: 'آپ کی QR شیٹ',
      body: 'اسے پرنٹ کر کے کاؤنٹر پر رکھیں۔ گاہک اسے اسکین کر کے آپ کی اور پڑوسیوں کی آفرز دیکھتے ہیں۔',
      download: 'PDF ڈاؤن لوڈ کریں',
      share: 'شیئر کریں',
      shareText: '{name} کی QR شیٹ — پرنٹ کے لیے تیار',
      preparing: 'تیار ہو رہا ہے…',
      failed: 'فائل تیار نہیں ہو سکی۔ دوبارہ کوشش کریں۔',
    },
    install: {
      title: 'ڈیش بورڈ کو ہوم اسکرین پر شامل کریں',
      body: 'روزانہ ایک ٹیپ میں کھولیں۔',
      iosBody: 'شیئر دبائیں، پھر “Add to Home Screen”۔',
      add: 'شامل کریں',
    },
    leaderboardRow: 'سب سے فعال دکانیں',
    form: {
      titleNew: 'نئی آفر',
      titleEdit: 'آفر میں ترمیم',
      titleDuplicate: 'آفر کی نقل',
      titleLabel: 'آفر کا عنوان',
      titleHint: 'مثال: تمام کافی پر 20% رعایت',
      descriptionLabel: 'تفصیل (اختیاری)',
      imageLabel: 'آفر کی تصویر (اختیاری)',
      imageAdd: 'تصویر شامل کریں',
      imageHelp: 'تصویر کھینچیں یا گیلری سے چنیں۔ JPG، PNG یا WebP — ہم سائز خود چھوٹا کر دیتے ہیں۔',
      imageReplace: 'تبدیل کریں',
      imageRemove: 'ہٹائیں',
      imageUploading: 'اپ لوڈ ہو رہی ہے…',
      imageTooBig: 'سائز چھوٹا کرنے کے بعد بھی تصویر بہت بڑی ہے۔ چھوٹی تصویر چنیں۔',
      imageWrongType: 'یہ فائل معاون تصویر نہیں۔ JPG، PNG یا WebP استعمال کریں۔',
      imageNetwork: 'اپ لوڈ کے دوران کنکشن ٹوٹ گیا۔ دوبارہ کوشش کریں۔',
      imageGeneric: 'تصویر اپ لوڈ نہیں ہو سکی۔',
      bidLabel: 'فی ویو قیمت',
      bidValue: '{n} بیلنس',
      bidLess: 'فہرست میں نیچے',
      bidMore: 'فہرست میں اوپر',
      bidExplain: 'قیمت جتنی زیادہ ہو، آپ کی آفر گاہک کی قریبی آفرز کی فہرست میں اتنی اوپر دکھائی دیتی ہے۔',
      bidTier: 'جب قیمتیں قریب ہوں تو اونچے درجے والی دکان پہلے آتی ہے۔',
      bidReach: 'قیمت آپ کی آفر کا فاصلہ نہیں بڑھاتی — اس کے لیے بلنگ صفحے پر “ریچ” ایڈ آن ہے۔',
      bidEstimate: 'آپ کا بیلنس ({balance}) اس قیمت پر {n} ویوز کے لیے کافی ہے۔',
      bidEstimateNone: 'آپ کا بیلنس اس قیمت پر ایک ویو کے لیے بھی کافی نہیں — پہلے ٹاپ اپ کریں۔',
      datesLabel: 'آفر کی مدت',
      start: 'شروع',
      end: 'اختتام',
      noStart: 'ابھی سے',
      noEnd: 'کوئی اختتامی تاریخ نہیں',
      presetToday: 'صرف آج',
      presetWeek: 'ایک ہفتہ',
      presetMonth: 'ایک مہینہ',
      clear: 'صاف کریں',
      endError: 'اختتامی تاریخ شروع کی تاریخ کے دن یا اس کے بعد ہونی چاہیے۔',
      pickDate: 'تاریخ چنیں',
      prevMonth: 'پچھلا مہینہ',
      nextMonth: 'اگلا مہینہ',
      previewHeading: 'گاہک اسے کیسے دیکھیں گے',
      previewNote: 'براہِ راست پیش نظارہ — لکھتے ہی بدلتا ہے۔',
      translationsHeading: 'ترجمے (اختیاری)',
      translationsHint: 'خالی چھوڑیں تو آفر خود بخود ترجمہ ہو جائے گی۔ صرف تب بھریں جب آپ متن پر مکمل کنٹرول چاہیں۔',
      activeWarning: 'آپ کی ایک آفر پہلے سے فعال ہے۔ پہلے ہوم صفحے سے اسے روکیں، پھر نئی آفر بنائیں۔',
      create: 'آفر بنائیں',
      creating: 'بن رہی ہے…',
      save: 'تبدیلیاں محفوظ کریں',
      saving: 'محفوظ ہو رہا ہے…',
      discardTitle: 'یہ آفر چھوڑ دیں؟',
      discardBody: 'آپ کا درج کردہ مواد محفوظ نہیں ہوگا۔',
      discard: 'چھوڑ دیں',
      keepEditing: 'ترمیم جاری رکھیں',
      required: 'عنوان ضروری ہے',
    },
    redeem: {
      aim: 'کیمرہ گاہک کے کارڈ پر QR کوڈ کی طرف کریں',
      startCamera: 'کیمرہ آن کریں',
      cameraIdle: 'کیمرہ بند ہے',
      deniedTitle: 'کیمرے تک رسائی نہیں',
      deniedBody: 'کیمرے کی اجازت دیں: ایڈریس بار کے ساتھ تالے کا نشان دبائیں ← اجازتیں ← کیمرہ ← اجازت دیں، پھر دوبارہ کوشش کریں۔',
      unsupportedTitle: 'یہ براؤزر کیمرہ استعمال نہیں کر سکتا — نیچے دستی اندراج استعمال کریں۔',
      torchOn: 'فلیش لائٹ آن کریں',
      torchOff: 'فلیش لائٹ بند کریں',
      manualHeading: 'کوڈ دستی طور پر درج کریں',
      manualBody: 'اگر کیمرہ کام نہ کرے تو کارڈ کا کوڈ یہاں پیسٹ کریں۔',
      manualPlaceholder: 'کارڈ کوڈ',
      submit: 'چیک کریں',
      checking: 'چیک ہو رہا ہے…',
      successTitle: 'ریڈیم ہو گیا',
      successBody: 'گاہک کو آفر دیں۔',
      alreadyTitle: 'پہلے استعمال ہو چکا',
      alreadyBody: 'یہ گاہک یہ آفر پہلے ریڈیم کر چکا ہے۔',
      passTitle: 'کارڈ اب فعال نہیں',
      passBody: 'گاہک نے کارڈ اپنے والیٹ سے ہٹا دیا ہے۔ وہ آپ کی QR شیٹ اسکین کر کے اسے دوبارہ شامل کر سکتا ہے۔',
      invalidTitle: 'غلط کوڈ',
      invalidBody: 'یہ درست جیران کارڈ نہیں۔ گاہک سے کارڈ کھولنے کو کہیں اور دوبارہ کوشش کریں۔',
      noOfferTitle: 'آپ کی دکان کی کوئی فعال آفر نہیں',
      noOfferBody: 'ریڈیم شروع کرنے کے لیے آفر فعال کریں۔',
      frozenTitle: 'یہ اکاؤنٹ منجمد ہے',
      networkTitle: 'کنکشن نہیں ہو سکا',
      networkBody: 'انٹرنیٹ چیک کر کے دوبارہ کوشش کریں۔',
      genericTitle: 'ریڈیم نہیں ہو سکا',
      scanNext: 'اگلا گاہک اسکین کریں',
      activateOffer: 'آفر فعال کریں',
      recentHeading: 'حالیہ ریڈیمپشنز',
      recentEmpty: 'ابھی کوئی ریڈیمپشن نہیں۔',
      newCustomer: 'نیا گاہک',
      returningCustomer: 'واپس آنے والا گاہک',
      todayCount: 'آج کی ریڈیمپشن نمبر {n}',
    },
    profile: {
      identityHeading: 'دکان کی پہچان',
      logo: 'لوگو',
      cover: 'کور تصویر (اختیاری)',
      logoHelp: 'مربع تصویر، 512×512 پکسل یا بڑی۔ PNG، JPG یا WebP، زیادہ سے زیادہ 2 MB۔',
      coverHelp: 'چوڑی 16:9 تصویر، 1200 پکسل چوڑی۔ PNG، JPG یا WebP، زیادہ سے زیادہ 2 MB۔',
      upload: 'تصویر اپ لوڈ کریں',
      replace: 'تبدیل کریں',
      remove: 'ہٹائیں',
      uploading: 'اپ لوڈ ہو رہی ہے…',
      uploaded: 'محفوظ ہو گیا',
      removed: 'ہٹا دیا گیا',
      tooBig: 'تصویر 2 MB سے بڑی ہے۔',
      wrongType: 'غیر معاون فائل۔ PNG، JPG یا WebP استعمال کریں۔',
      network: 'کنکشن ٹوٹ گیا۔ دوبارہ کوشش کریں۔',
      generic: 'تصویر محفوظ نہیں ہو سکی۔',
      previewHeading: 'آپ کی دکان کیسی دکھتی ہے',
      previewCard: 'آفر کارڈ پر',
      previewSheet: 'QR شیٹ پر',
      shopHeading: 'دکان',
      contactHeading: 'رابطہ',
      locationHeading: 'مقام',
      languageHeading: 'زبان',
      accountHeading: 'اکاؤنٹ',
      coordsSaved: 'مقام محفوظ: {lat}، {lng}',
      coordsUnsaved: 'نیا مقام ({lat}، {lng}) — لاگو کرنے کے لیے محفوظ کریں',
      coordsNone: 'ابھی کوئی مقام مقرر نہیں۔',
      mapHint: 'دکان کا دروازہ نشان زد کرنے کے لیے نقشے پر ٹیپ کریں یا پن کھینچیں۔',
      phoneHint: 'مثال: ‎+966 5X XXX XXXX',
      phoneNotSaudi: 'یہ عام سعودی نمبر نہیں لگتا — دوبارہ چیک کریں (آپ پھر بھی محفوظ کر سکتے ہیں)۔',
      dirtyBar: 'آپ کی تبدیلیاں محفوظ نہیں ہوئیں',
      discard: 'واپس لیں',
      saved: 'تبدیلیاں محفوظ ہو گئیں',
    },
    billing: {
      subscriptionHeading: 'سبسکرپشن',
      packagesHeading: 'اشتہاری بیلنس پیکجز',
      packageCredits: '{n} اشتہاری بیلنس',
      perCredit: '{price} فی 100',
      historyHeading: 'ہسٹری',
      emptyTitle: 'ابھی کوئی سرگرمی نہیں',
      emptyBody: 'ٹاپ اپ، سبسکرپشن ادائیگیاں اور آپ کی آفرز پر خرچ ہونے والا بیلنس یہاں دکھایا جائے گا۔',
      reachHeading: 'ریچ',
    },
    leaderboard: {
      emptyWeekTitle: 'اس ہفتے ابھی کوئی نیا گاہک نہیں',
      emptyMonthTitle: 'اس مہینے ابھی کوئی نیا گاہک نہیں',
      emptyBody: 'جب نئے گاہک کسی بھی دکان کی QR شیٹ اسکین کرتے ہیں تو وہ دکان یہاں نظر آتی ہے۔ اپنی شیٹ پرنٹ کر کے کاؤنٹر پر رکھیں۔',
      errorTitle: 'فہرست لوڈ نہیں ہو سکی',
    },
  },
}
