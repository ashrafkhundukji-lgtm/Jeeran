import type { Locale } from './locale'
import { FREE_TRIAL_MONTHS } from './trial'

// Minimum length for a NEW password (signup and reset). Login deliberately
// enforces no minimum, so accounts created under the old 6-character rule
// can still sign in. Supabase's own "Minimum password length" setting
// (Auth > Providers > Email) should be set to the same number.
export const MIN_PASSWORD_LENGTH = 8

// Login/signup copy. Arabic is the base (approved mockup,
// downloads/handoff/landing-auth/auth.html); en and ur are translations.

// Friendly messages for the Supabase auth errors these two forms can hit,
// keyed by our own reason (see authErrorReason in src/components/auth/
// AuthForm.tsx). Anything unrecognised falls back to `generic`.
export interface AuthErrorCopy {
  invalidCredentials: string
  emailNotConfirmed: string
  emailTaken: string
  invalidEmail: string
  weakPassword: string
  rateLimited: string
  network: string
  generic: string
}

interface SharedAuthCopy {
  emailLabel: string
  passwordLabel: string
  showPassword: string
  hidePassword: string
  sideHeading: string
  sideBody: string
  sidePhotoAlt: string
  errors: AuthErrorCopy
}

export interface LoginCopy extends SharedAuthCopy {
  title: string
  subtitle: string
  submit: string
  submitting: string
  noAccount: string
  signUpLink: string
  forgotLink: string
  // Shown when arriving from /reset-password after a successful reset.
  resetSuccess: string
}

export interface SignupCopy extends SharedAuthCopy {
  title: string
  subtitle: string
  passwordHint: string
  submit: string
  submitting: string
  setupNote: string
  haveAccount: string
  loginLink: string
  confirmationTitle: string
  // Neutral on purpose: Supabase answers "success" both for a new email and
  // for one that's already registered (no identities), and we must not
  // reveal which — so the same message covers both.
  confirmationNotice: string
  confirmationLogin: string
  confirmationReset: string
}

export interface ForgotCopy {
  title: string
  subtitle: string
  emailLabel: string
  submit: string
  submitting: string
  sentTitle: string
  // Same message whether or not the email has an account.
  sentBody: string
  resend: string
  resendIn: (seconds: number) => string
  backToLogin: string
  sideHeading: string
  sideBody: string
  sidePhotoAlt: string
  errors: AuthErrorCopy
}

export interface ResetCopy {
  title: string
  subtitle: string
  newPasswordLabel: string
  confirmPasswordLabel: string
  passwordHint: string
  mismatch: string
  showPassword: string
  hidePassword: string
  submit: string
  submitting: string
  checking: string
  invalidTitle: string
  invalidBody: string
  requestNew: string
  backToLogin: string
  sideHeading: string
  sideBody: string
  sidePhotoAlt: string
  errors: AuthErrorCopy
}

const AR_SHARED = {
  emailLabel: 'البريد الإلكتروني',
  passwordLabel: 'كلمة المرور',
  showPassword: 'إظهار كلمة المرور',
  hidePassword: 'إخفاء كلمة المرور',
  sidePhotoAlt: 'شارع في حي سعودي عند الغروب',
  errors: {
    invalidCredentials: 'البريد الإلكتروني أو كلمة المرور غير صحيحة. تحقّق منهما وحاول مرة أخرى.',
    emailNotConfirmed: 'لم يتم تأكيد بريدك بعد. افتح رسالة التأكيد في بريدك ثم سجّل الدخول.',
    emailTaken: 'هذا البريد مسجّل من قبل. جرّب تسجيل الدخول بدلًا من ذلك.',
    invalidEmail: 'هذا البريد الإلكتروني غير صالح. تحقّق من كتابته.',
    weakPassword: `كلمة المرور قصيرة أو ضعيفة. استخدم ${MIN_PASSWORD_LENGTH} أحرف على الأقل.`,
    rateLimited: 'محاولات كثيرة خلال وقت قصير. انتظر قليلًا ثم حاول مرة أخرى.',
    network: 'تعذّر الاتصال. تحقّق من الإنترنت وحاول مرة أخرى.',
    generic: 'حدث خطأ غير متوقع. حاول مرة أخرى بعد قليل.',
  },
}

const EN_SHARED = {
  emailLabel: 'Email',
  passwordLabel: 'Password',
  showPassword: 'Show password',
  hidePassword: 'Hide password',
  sidePhotoAlt: 'A Saudi neighborhood street at sunset',
  errors: {
    invalidCredentials: "That email or password isn't right. Check both and try again.",
    emailNotConfirmed: "Your email isn't confirmed yet. Open the confirmation email, then log in.",
    emailTaken: 'This email is already registered. Try logging in instead.',
    invalidEmail: "That email address doesn't look valid. Check how it's typed.",
    weakPassword: `That password is too short or too weak. Use at least ${MIN_PASSWORD_LENGTH} characters.`,
    rateLimited: 'Too many attempts in a short time. Wait a moment and try again.',
    network: "Couldn't connect. Check your internet and try again.",
    generic: 'Something went wrong. Please try again in a moment.',
  },
}

const UR_SHARED = {
  emailLabel: 'ای میل',
  passwordLabel: 'پاس ورڈ',
  showPassword: 'پاس ورڈ دکھائیں',
  hidePassword: 'پاس ورڈ چھپائیں',
  sidePhotoAlt: 'غروبِ آفتاب کے وقت ایک سعودی محلے کی گلی',
  errors: {
    invalidCredentials: 'ای میل یا پاس ورڈ درست نہیں۔ دونوں چیک کر کے دوبارہ کوشش کریں۔',
    emailNotConfirmed: 'آپ کا ای میل ابھی تصدیق شدہ نہیں۔ تصدیقی ای میل کھولیں، پھر لاگ اِن کریں۔',
    emailTaken: 'یہ ای میل پہلے سے رجسٹرڈ ہے۔ اس کے بجائے لاگ اِن کر کے دیکھیں۔',
    invalidEmail: 'یہ ای میل ایڈریس درست نہیں لگتا۔ اسپیلنگ چیک کریں۔',
    weakPassword: `پاس ورڈ بہت چھوٹا یا کمزور ہے۔ کم از کم ${MIN_PASSWORD_LENGTH} حروف استعمال کریں۔`,
    rateLimited: 'کم وقت میں بہت زیادہ کوششیں۔ تھوڑا انتظار کر کے دوبارہ کوشش کریں۔',
    network: 'رابطہ نہیں ہو سکا۔ انٹرنیٹ چیک کر کے دوبارہ کوشش کریں۔',
    generic: 'کچھ غلط ہو گیا۔ تھوڑی دیر بعد دوبارہ کوشش کریں۔',
  },
}

export const LOGIN_COPY: Record<Locale, LoginCopy> = {
  ar: {
    ...AR_SHARED,
    title: 'أهلاً بعودتك',
    subtitle: 'سجّل الدخول لإدارة عروض محلك.',
    submit: 'تسجيل الدخول',
    submitting: 'جارٍ تسجيل الدخول…',
    noAccount: 'ليس لديك حساب؟',
    signUpLink: 'إنشاء حساب',
    forgotLink: 'نسيت كلمة المرور؟',
    resetSuccess: 'تم تحديث كلمة المرور. سجّل الدخول بكلمة المرور الجديدة.',
    sideHeading: 'عروض محلات حيّك، في جيبك',
    sideBody: 'امسح الرمز في المحل واحفظ عضويتك في Google Wallet.',
  },
  en: {
    ...EN_SHARED,
    title: 'Welcome back',
    subtitle: "Log in to manage your shop's offers.",
    submit: 'Log in',
    submitting: 'Logging in…',
    noAccount: 'No account yet?',
    signUpLink: 'Create one',
    forgotLink: 'Forgot password?',
    resetSuccess: 'Your password was updated. Log in with your new password.',
    sideHeading: 'Neighborhood offers, in your pocket',
    sideBody: 'Scan the code at the shop and save your membership in Google Wallet.',
  },
  ur: {
    ...UR_SHARED,
    title: 'خوش آمدید',
    subtitle: 'اپنی دکان کے آفرز چلانے کے لیے لاگ اِن کریں۔',
    submit: 'لاگ اِن',
    submitting: 'لاگ اِن ہو رہا ہے…',
    noAccount: 'اکاؤنٹ نہیں ہے؟',
    signUpLink: 'اکاؤنٹ بنائیں',
    forgotLink: 'پاس ورڈ بھول گئے؟',
    resetSuccess: 'آپ کا پاس ورڈ اپ ڈیٹ ہو گیا۔ نئے پاس ورڈ سے لاگ اِن کریں۔',
    sideHeading: 'محلے کی دکانوں کے آفرز، آپ کی جیب میں',
    sideBody: 'دکان پر کوڈ اسکین کریں اور اپنی رکنیت Google Wallet میں محفوظ کریں۔',
  },
}

export const SIGNUP_COPY: Record<Locale, SignupCopy> = {
  ar: {
    ...AR_SHARED,
    title: 'ابدأ مجانًا',
    subtitle: 'أنشئ حسابًا لمحلك في دقيقة.',
    passwordHint: `${MIN_PASSWORD_LENGTH} أحرف على الأقل.`,
    submit: 'إنشاء حساب',
    submitting: 'جارٍ إنشاء الحساب…',
    setupNote: 'بعد التسجيل: ثلاث خطوات سريعة لإعداد محلك (الاسم، الموقع، النشاط).',
    haveAccount: 'لديك حساب؟',
    loginLink: 'تسجيل الدخول',
    confirmationTitle: 'تحقّق من بريدك',
    confirmationNotice: 'تحقّق من بريدك للمتابعة. إذا كان لديك حساب من قبل، سجّل الدخول أو أعد تعيين كلمة المرور.',
    confirmationLogin: 'تسجيل الدخول',
    confirmationReset: 'إعادة تعيين كلمة المرور',
    sideHeading: 'ابدأ بحامل واحد على طاولتك',
    sideBody: `جرّبه مجانًا لمدة ${FREE_TRIAL_MONTHS} أشهر، والنقاط الأولى تأتي من أول عرض يُعرض عندك.`,
  },
  en: {
    ...EN_SHARED,
    title: 'Start free',
    subtitle: 'Create an account for your shop in a minute.',
    passwordHint: `At least ${MIN_PASSWORD_LENGTH} characters.`,
    submit: 'Create account',
    submitting: 'Creating account…',
    setupNote: 'After signing up: three quick steps to set up your shop (name, location, business type).',
    haveAccount: 'Already have an account?',
    loginLink: 'Log in',
    confirmationTitle: 'Check your email',
    confirmationNotice: 'Check your email to continue. If you already have an account, log in or reset your password.',
    confirmationLogin: 'Log in',
    confirmationReset: 'Reset password',
    sideHeading: 'Start with one stand on your counter',
    sideBody: `Try it free for ${FREE_TRIAL_MONTHS} months; your first credits come from the first offer shown at your place.`,
  },
  ur: {
    ...UR_SHARED,
    title: 'مفت شروع کریں',
    subtitle: 'ایک منٹ میں اپنی دکان کا اکاؤنٹ بنائیں۔',
    passwordHint: `کم از کم ${MIN_PASSWORD_LENGTH} حروف۔`,
    submit: 'اکاؤنٹ بنائیں',
    submitting: 'اکاؤنٹ بن رہا ہے…',
    setupNote: 'سائن اپ کے بعد: دکان سیٹ اپ کرنے کے لیے تین تیز قدم (نام، مقام، کاروبار کی قسم)۔',
    haveAccount: 'پہلے سے اکاؤنٹ ہے؟',
    loginLink: 'لاگ اِن',
    confirmationTitle: 'اپنا ای میل چیک کریں',
    confirmationNotice: 'آگے بڑھنے کے لیے اپنا ای میل چیک کریں۔ اگر آپ کا پہلے سے اکاؤنٹ ہے تو لاگ اِن کریں یا پاس ورڈ ری سیٹ کریں۔',
    confirmationLogin: 'لاگ اِن',
    confirmationReset: 'پاس ورڈ ری سیٹ کریں',
    sideHeading: 'اپنے کاؤنٹر پر ایک اسٹینڈ سے شروع کریں',
    sideBody: `${FREE_TRIAL_MONTHS} مہینے مفت آزمائیں، اور پہلے کریڈٹس آپ کے یہاں دکھائے گئے پہلے آفر سے آتے ہیں۔`,
  },
}

export const FORGOT_COPY: Record<Locale, ForgotCopy> = {
  ar: {
    ...AR_SHARED,
    title: 'نسيت كلمة المرور؟',
    subtitle: 'أدخل بريدك الإلكتروني وسنرسل لك رابطًا لتعيين كلمة مرور جديدة.',
    submit: 'أرسل الرابط',
    submitting: 'جارٍ الإرسال…',
    sentTitle: 'تحقّق من بريدك',
    sentBody: 'إذا كان لهذا البريد حساب، فقد أرسلنا إليه رابطًا لتعيين كلمة المرور. قد يستغرق وصوله بضع دقائق، وتحقّق من مجلد الرسائل غير المرغوب فيها.',
    resend: 'إعادة الإرسال',
    resendIn: (s) => `إعادة الإرسال بعد ${s} ث`,
    backToLogin: 'العودة إلى تسجيل الدخول',
    sideHeading: 'عروض محلات حيّك، في جيبك',
    sideBody: 'امسح الرمز في المحل واحفظ عضويتك في Google Wallet.',
  },
  en: {
    ...EN_SHARED,
    title: 'Forgot your password?',
    subtitle: "Enter your email and we'll send you a link to set a new password.",
    submit: 'Send link',
    submitting: 'Sending…',
    sentTitle: 'Check your email',
    sentBody: 'If this email has an account, we sent a link to set a new password. It can take a few minutes; check your spam folder too.',
    resend: 'Resend',
    resendIn: (s) => `Resend in ${s}s`,
    backToLogin: 'Back to log in',
    sideHeading: 'Neighborhood offers, in your pocket',
    sideBody: 'Scan the code at the shop and save your membership in Google Wallet.',
  },
  ur: {
    ...UR_SHARED,
    title: 'پاس ورڈ بھول گئے؟',
    subtitle: 'اپنا ای میل درج کریں، ہم نیا پاس ورڈ سیٹ کرنے کا لنک بھیج دیں گے۔',
    submit: 'لنک بھیجیں',
    submitting: 'بھیجا جا رہا ہے…',
    sentTitle: 'اپنا ای میل چیک کریں',
    sentBody: 'اگر اس ای میل کا اکاؤنٹ ہے تو ہم نے پاس ورڈ سیٹ کرنے کا لنک بھیج دیا ہے۔ اس میں چند منٹ لگ سکتے ہیں؛ اسپام فولڈر بھی دیکھیں۔',
    resend: 'دوبارہ بھیجیں',
    resendIn: (s) => `${s} سیکنڈ بعد دوبارہ بھیجیں`,
    backToLogin: 'لاگ اِن پر واپس جائیں',
    sideHeading: 'محلے کی دکانوں کے آفرز، آپ کی جیب میں',
    sideBody: 'دکان پر کوڈ اسکین کریں اور اپنی رکنیت Google Wallet میں محفوظ کریں۔',
  },
}

export const RESET_COPY: Record<Locale, ResetCopy> = {
  ar: {
    ...AR_SHARED,
    title: 'تعيين كلمة مرور جديدة',
    subtitle: 'اختر كلمة مرور جديدة لحسابك.',
    newPasswordLabel: 'كلمة المرور الجديدة',
    confirmPasswordLabel: 'تأكيد كلمة المرور',
    passwordHint: `${MIN_PASSWORD_LENGTH} أحرف على الأقل.`,
    mismatch: 'كلمتا المرور غير متطابقتين.',
    submit: 'حفظ كلمة المرور',
    submitting: 'جارٍ الحفظ…',
    checking: 'جارٍ التحقق من الرابط…',
    invalidTitle: 'الرابط غير صالح أو انتهت صلاحيته',
    invalidBody: 'روابط تعيين كلمة المرور تُستخدم مرة واحدة وتنتهي صلاحيتها بعد مدة قصيرة. اطلب رابطًا جديدًا.',
    requestNew: 'اطلب رابطًا جديدًا',
    backToLogin: 'العودة إلى تسجيل الدخول',
    sideHeading: 'عروض محلات حيّك، في جيبك',
    sideBody: 'امسح الرمز في المحل واحفظ عضويتك في Google Wallet.',
  },
  en: {
    ...EN_SHARED,
    title: 'Set a new password',
    subtitle: 'Choose a new password for your account.',
    newPasswordLabel: 'New password',
    confirmPasswordLabel: 'Confirm password',
    passwordHint: `At least ${MIN_PASSWORD_LENGTH} characters.`,
    mismatch: "The passwords don't match.",
    submit: 'Save password',
    submitting: 'Saving…',
    checking: 'Checking your link…',
    invalidTitle: 'This link is invalid or has expired',
    invalidBody: 'Password reset links work once and expire after a short time. Request a new one.',
    requestNew: 'Request a new link',
    backToLogin: 'Back to log in',
    sideHeading: 'Neighborhood offers, in your pocket',
    sideBody: 'Scan the code at the shop and save your membership in Google Wallet.',
  },
  ur: {
    ...UR_SHARED,
    title: 'نیا پاس ورڈ سیٹ کریں',
    subtitle: 'اپنے اکاؤنٹ کے لیے نیا پاس ورڈ منتخب کریں۔',
    newPasswordLabel: 'نیا پاس ورڈ',
    confirmPasswordLabel: 'پاس ورڈ کی تصدیق کریں',
    passwordHint: `کم از کم ${MIN_PASSWORD_LENGTH} حروف۔`,
    mismatch: 'دونوں پاس ورڈ ایک جیسے نہیں ہیں۔',
    submit: 'پاس ورڈ محفوظ کریں',
    submitting: 'محفوظ ہو رہا ہے…',
    checking: 'آپ کا لنک چیک ہو رہا ہے…',
    invalidTitle: 'یہ لنک درست نہیں یا اس کی میعاد ختم ہو گئی ہے',
    invalidBody: 'پاس ورڈ ری سیٹ لنک صرف ایک بار کام کرتے ہیں اور کچھ دیر بعد ختم ہو جاتے ہیں۔ نیا لنک منگوائیں۔',
    requestNew: 'نیا لنک منگوائیں',
    backToLogin: 'لاگ اِن پر واپس جائیں',
    sideHeading: 'محلے کی دکانوں کے آفرز، آپ کی جیب میں',
    sideBody: 'دکان پر کوڈ اسکین کریں اور اپنی رکنیت Google Wallet میں محفوظ کریں۔',
  },
}
