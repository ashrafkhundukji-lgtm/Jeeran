import type { Locale } from './locale'

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
  confirmationNotice: string
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
    weakPassword: 'كلمة المرور قصيرة أو ضعيفة. استخدم 6 أحرف على الأقل.',
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
    weakPassword: 'That password is too short or too weak. Use at least 6 characters.',
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
    weakPassword: 'پاس ورڈ بہت چھوٹا یا کمزور ہے۔ کم از کم 6 حروف استعمال کریں۔',
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
    sideHeading: 'محلے کی دکانوں کے آفرز، آپ کی جیب میں',
    sideBody: 'دکان پر کوڈ اسکین کریں اور اپنی رکنیت Google Wallet میں محفوظ کریں۔',
  },
}

export const SIGNUP_COPY: Record<Locale, SignupCopy> = {
  ar: {
    ...AR_SHARED,
    title: 'ابدأ مجانًا',
    subtitle: 'أنشئ حسابًا لمحلك في دقيقة.',
    passwordHint: '6 أحرف على الأقل.',
    submit: 'إنشاء حساب',
    submitting: 'جارٍ إنشاء الحساب…',
    setupNote: 'بعد التسجيل: ثلاث خطوات سريعة لإعداد محلك (الاسم، الموقع، النشاط).',
    haveAccount: 'لديك حساب؟',
    loginLink: 'تسجيل الدخول',
    confirmationTitle: 'تحقّق من بريدك',
    confirmationNotice: 'أرسلنا رسالة تأكيد إلى بريدك. افتحها لتأكيد حسابك، ثم سجّل الدخول.',
    sideHeading: 'ابدأ بحامل واحد على طاولتك',
    sideBody: 'جرّبه مجانًا لمدة 3 أشهر، والنقاط الأولى تأتي من أول عرض يُعرض عندك.',
  },
  en: {
    ...EN_SHARED,
    title: 'Start free',
    subtitle: 'Create an account for your shop in a minute.',
    passwordHint: 'At least 6 characters.',
    submit: 'Create account',
    submitting: 'Creating account…',
    setupNote: 'After signing up: three quick steps to set up your shop (name, location, business type).',
    haveAccount: 'Already have an account?',
    loginLink: 'Log in',
    confirmationTitle: 'Check your email',
    confirmationNotice: 'We sent a confirmation email. Open it to confirm your account, then log in.',
    sideHeading: 'Start with one stand on your counter',
    sideBody: 'Try it free for 3 months; your first credits come from the first offer shown at your place.',
  },
  ur: {
    ...UR_SHARED,
    title: 'مفت شروع کریں',
    subtitle: 'ایک منٹ میں اپنی دکان کا اکاؤنٹ بنائیں۔',
    passwordHint: 'کم از کم 6 حروف۔',
    submit: 'اکاؤنٹ بنائیں',
    submitting: 'اکاؤنٹ بن رہا ہے…',
    setupNote: 'سائن اپ کے بعد: دکان سیٹ اپ کرنے کے لیے تین تیز قدم (نام، مقام، کاروبار کی قسم)۔',
    haveAccount: 'پہلے سے اکاؤنٹ ہے؟',
    loginLink: 'لاگ اِن',
    confirmationTitle: 'اپنا ای میل چیک کریں',
    confirmationNotice: 'ہم نے تصدیقی ای میل بھیجی ہے۔ اسے کھول کر اکاؤنٹ کی تصدیق کریں، پھر لاگ اِن کریں۔',
    sideHeading: 'اپنے کاؤنٹر پر ایک اسٹینڈ سے شروع کریں',
    sideBody: '3 مہینے مفت آزمائیں، اور پہلے کریڈٹس آپ کے یہاں دکھائے گئے پہلے آفر سے آتے ہیں۔',
  },
}
