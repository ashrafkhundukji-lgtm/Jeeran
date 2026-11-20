import type { Locale } from './locale'

// Owner app (installable PWA): install banner, iPhone guide, notification
// settings page (/dashboard/notifications). Push message text itself lives
// in ./ownerPush.ts.

export type PrefType = 'redeemed' | 'earned' | 'signups' | 'offer_status' | 'trial'

interface OwnerAppCopy {
  install: {
    title: string
    body: string
    add: string
    later: string
    iosTitle: string
    iosBody: string
    iosSteps: [string, string, string]
  }
  settings: {
    heading: string
    linkLabel: string
    linkHint: string
    introTitle: string
    introBody: string
    types: Record<PrefType, { label: string; hint: string }>
    turnOn: string
    turningOn: string
    onHere: string
    typesHeading: string
    devicesHeading: string
    thisDevice: string
    otherDevice: string
    turnOff: string
    addedOn: (date: string) => string
    noDevices: string
    sendTest: string
    sending: string
    testSent: string
    testFailed: string
    saveFailed: string
    blockedTitle: string
    blockedAndroid: string
    blockedIos: string
    blockedOther: string
    dismissed: string
    iosTitle: string
    iosBody: string
    unsupported: string
    notConfigured: string
    error: string
    privacy: string
  }
}

export const OWNER_APP_COPY: Record<Locale, OwnerAppCopy> = {
  ar: {
    install: {
      title: 'ثبّت تطبيق جيران للمحلات',
      body: 'افتح محلك بلمسة واحدة واستقبل إشعارًا عند استخدام عرضك.',
      add: 'تثبيت',
      later: 'لاحقًا',
      iosTitle: 'أضف جيران إلى الشاشة الرئيسية',
      iosBody: 'على iPhone تصل الإشعارات فقط بعد إضافة التطبيق إلى الشاشة الرئيسية:',
      iosSteps: ['اضغط زر المشاركة أسفل Safari.', 'اختر «إضافة إلى الشاشة الرئيسية».', 'افتح جيران من الشاشة الرئيسية وسجّل الدخول.'],
    },
    settings: {
      heading: 'الإشعارات',
      linkLabel: 'الإشعارات',
      linkHint: 'استخدام العروض، الرصيد، الزبائن الجدد',
      introTitle: 'اعرف ما يحدث في محلك فورًا',
      introBody: 'نرسل إشعارًا إلى هذا الهاتف عندما:',
      types: {
        redeemed: { label: 'استخدم زبون عرضك', hint: 'مع اسم العرض والرصيد المخصوم.' },
        earned: { label: 'ربحت رصيدًا', hint: 'زبون جاء عن طريقك استخدم عرض محل آخر.' },
        signups: { label: 'زبائن جدد عبر رمز QR', hint: 'إشعار واحد في الساعة كحد أقصى مع العدد.' },
        offer_status: { label: 'عرضك لم يعد يظهر', hint: 'مع السبب ورابط لإصلاحه.' },
        trial: { label: 'التجربة تنتهي قريبًا', hint: 'قبل انتهاء التجربة المجانية.' },
      },
      turnOn: 'شغّل الإشعارات على هذا الهاتف',
      turningOn: 'جارٍ التشغيل…',
      onHere: 'الإشعارات مفعّلة على هذا الهاتف.',
      typesHeading: 'ما الذي يصلك',
      devicesHeading: 'الأجهزة',
      thisDevice: 'هذا الهاتف',
      otherDevice: 'جهاز آخر',
      turnOff: 'إيقاف',
      addedOn: (d) => `أُضيف في ${d}`,
      noDevices: 'لا توجد أجهزة مفعّلة بعد.',
      sendTest: 'أرسل إشعارًا تجريبيًا',
      sending: 'جارٍ الإرسال…',
      testSent: 'تم الإرسال. سيظهر الإشعار خلال ثوانٍ.',
      testFailed: 'تعذّر إرسال الإشعار التجريبي. حاول مرة أخرى.',
      saveFailed: 'تعذّر حفظ التغيير. حاول مرة أخرى.',
      blockedTitle: 'الإشعارات محظورة في المتصفح',
      blockedAndroid: 'اضغط رمز القفل بجانب العنوان أو افتح إعدادات التطبيق، ثم الأذونات ← الإشعارات ← سماح. بعدها ارجع إلى هذه الصفحة.',
      blockedIos: 'افتح الإعدادات ← الإشعارات ← جيران، وفعّل «السماح بالإشعارات». بعدها ارجع إلى هذه الصفحة.',
      blockedOther: 'افتح إعدادات الموقع في المتصفح واسمح بالإشعارات، ثم أعد تحميل الصفحة.',
      dismissed: 'لم يتم التفعيل. اضغط الزر مرة أخرى واختر «سماح».',
      iosTitle: 'أضف التطبيق إلى الشاشة الرئيسية أولًا',
      iosBody: 'على iPhone تعمل الإشعارات فقط من تطبيق جيران على الشاشة الرئيسية (iOS 16.4 أو أحدث):',
      unsupported: 'هذا المتصفح لا يدعم الإشعارات. افتح الصفحة في Chrome على Android أو من الشاشة الرئيسية على iPhone.',
      notConfigured: 'الإشعارات غير متاحة حاليًا. حاول لاحقًا.',
      error: 'حدث خطأ. حاول مرة أخرى.',
      privacy: 'لا تحتوي الإشعارات على أسماء الزبائن أو أرقامهم أو مواقعهم.',
    },
  },
  en: {
    install: {
      title: 'Install the Jeeran for Shops app',
      body: 'Open your shop with one tap and get notified when your offer is used.',
      add: 'Install',
      later: 'Later',
      iosTitle: 'Add Jeeran to your Home Screen',
      iosBody: 'On iPhone, notifications only work after you add the app to your Home Screen:',
      iosSteps: ['Tap the Share button at the bottom of Safari.', 'Choose “Add to Home Screen”.', 'Open Jeeran from your Home Screen and sign in.'],
    },
    settings: {
      heading: 'Notifications',
      linkLabel: 'Notifications',
      linkHint: 'Redemptions, credits, new customers',
      introTitle: 'Know what happens in your shop, right away',
      introBody: 'We send a notification to this phone when:',
      types: {
        redeemed: { label: 'A customer redeemed your offer', hint: 'With the offer name and credits spent.' },
        earned: { label: 'You earned credits', hint: 'A customer you brought redeemed another shop’s offer.' },
        signups: { label: 'New customers through your QR stand', hint: 'At most one an hour, with a count.' },
        offer_status: { label: 'Your offer stopped showing', hint: 'With the reason and a link to fix it.' },
        trial: { label: 'Trial ending soon', hint: 'Before your free trial ends.' },
      },
      turnOn: 'Turn on notifications on this phone',
      turningOn: 'Turning on…',
      onHere: 'Notifications are on for this phone.',
      typesHeading: 'What you get',
      devicesHeading: 'Devices',
      thisDevice: 'This phone',
      otherDevice: 'Another device',
      turnOff: 'Turn off',
      addedOn: (d) => `Added ${d}`,
      noDevices: 'No devices turned on yet.',
      sendTest: 'Send a test',
      sending: 'Sending…',
      testSent: 'Sent. It should appear in a few seconds.',
      testFailed: 'Couldn’t send the test. Try again.',
      saveFailed: 'Couldn’t save that change. Try again.',
      blockedTitle: 'Notifications are blocked in the browser',
      blockedAndroid: 'Tap the lock icon next to the address, or open the app’s settings, then Permissions → Notifications → Allow. Then come back to this page.',
      blockedIos: 'Open Settings → Notifications → Jeeran and turn on “Allow Notifications”. Then come back to this page.',
      blockedOther: 'Open the site settings in your browser, allow notifications, then reload this page.',
      dismissed: 'Not turned on. Tap the button again and choose “Allow”.',
      iosTitle: 'Add the app to your Home Screen first',
      iosBody: 'On iPhone, notifications only work from the Jeeran app on your Home Screen (iOS 16.4 or later):',
      unsupported: 'This browser doesn’t support notifications. Use Chrome on Android, or the Home Screen app on iPhone.',
      notConfigured: 'Notifications aren’t available right now. Try later.',
      error: 'Something went wrong. Try again.',
      privacy: 'Notifications never include customer names, phone numbers or locations.',
    },
  },
  ur: {
    install: {
      title: 'جیران برائے دکان ایپ انسٹال کریں',
      body: 'ایک ٹیپ میں اپنی دکان کھولیں اور پیشکش استعمال ہونے پر اطلاع پائیں۔',
      add: 'انسٹال',
      later: 'بعد میں',
      iosTitle: 'جیران کو ہوم اسکرین پر شامل کریں',
      iosBody: 'iPhone پر اطلاعات صرف ایپ کو ہوم اسکرین پر شامل کرنے کے بعد آتی ہیں:',
      iosSteps: ['Safari کے نیچے شیئر بٹن دبائیں۔', '«Add to Home Screen» منتخب کریں۔', 'ہوم اسکرین سے جیران کھولیں اور سائن ان کریں۔'],
    },
    settings: {
      heading: 'اطلاعات',
      linkLabel: 'اطلاعات',
      linkHint: 'پیشکش کا استعمال، کریڈٹ، نئے گاہک',
      introTitle: 'اپنی دکان کی خبر فوراً پائیں',
      introBody: 'ہم اس فون پر اطلاع بھیجتے ہیں جب:',
      types: {
        redeemed: { label: 'گاہک نے آپ کی پیشکش استعمال کی', hint: 'پیشکش کے نام اور کٹے ہوئے کریڈٹ کے ساتھ۔' },
        earned: { label: 'آپ نے کریڈٹ کمائے', hint: 'آپ کے لائے ہوئے گاہک نے دوسری دکان کی پیشکش استعمال کی۔' },
        signups: { label: 'QR اسٹینڈ سے نئے گاہک', hint: 'ایک گھنٹے میں زیادہ سے زیادہ ایک، تعداد کے ساتھ۔' },
        offer_status: { label: 'آپ کی پیشکش نظر نہیں آ رہی', hint: 'وجہ اور درست کرنے کے لنک کے ساتھ۔' },
        trial: { label: 'ٹرائل جلد ختم ہو رہا ہے', hint: 'مفت ٹرائل ختم ہونے سے پہلے۔' },
      },
      turnOn: 'اس فون پر اطلاعات آن کریں',
      turningOn: 'آن ہو رہی ہیں…',
      onHere: 'اس فون پر اطلاعات آن ہیں۔',
      typesHeading: 'آپ کو کیا ملے گا',
      devicesHeading: 'آلات',
      thisDevice: 'یہ فون',
      otherDevice: 'دوسرا آلہ',
      turnOff: 'بند کریں',
      addedOn: (d) => `شامل کیا گیا ${d}`,
      noDevices: 'ابھی کوئی آلہ آن نہیں۔',
      sendTest: 'آزمائشی اطلاع بھیجیں',
      sending: 'بھیجی جا رہی ہے…',
      testSent: 'بھیج دی گئی۔ چند سیکنڈ میں نظر آئے گی۔',
      testFailed: 'آزمائشی اطلاع نہیں بھیجی جا سکی۔ دوبارہ کوشش کریں۔',
      saveFailed: 'تبدیلی محفوظ نہیں ہو سکی۔ دوبارہ کوشش کریں۔',
      blockedTitle: 'براؤزر میں اطلاعات بلاک ہیں',
      blockedAndroid: 'ایڈریس کے ساتھ تالے کا نشان دبائیں یا ایپ کی سیٹنگز کھولیں، پھر Permissions ← Notifications ← Allow۔ پھر اس صفحے پر واپس آئیں۔',
      blockedIos: 'Settings ← Notifications ← Jeeran کھولیں اور «Allow Notifications» آن کریں۔ پھر اس صفحے پر واپس آئیں۔',
      blockedOther: 'براؤزر میں سائٹ کی سیٹنگز کھولیں، اطلاعات کی اجازت دیں، پھر صفحہ دوبارہ لوڈ کریں۔',
      dismissed: 'آن نہیں ہوئیں۔ بٹن دوبارہ دبائیں اور «Allow» منتخب کریں۔',
      iosTitle: 'پہلے ایپ کو ہوم اسکرین پر شامل کریں',
      iosBody: 'iPhone پر اطلاعات صرف ہوم اسکرین والی جیران ایپ سے کام کرتی ہیں (iOS 16.4 یا نیا):',
      unsupported: 'یہ براؤزر اطلاعات کی سہولت نہیں دیتا۔ Android پر Chrome یا iPhone پر ہوم اسکرین ایپ استعمال کریں۔',
      notConfigured: 'اطلاعات ابھی دستیاب نہیں۔ بعد میں کوشش کریں۔',
      error: 'کچھ غلط ہو گیا۔ دوبارہ کوشش کریں۔',
      privacy: 'اطلاعات میں گاہکوں کے نام، فون نمبر یا مقام کبھی شامل نہیں ہوتے۔',
    },
  },
}
