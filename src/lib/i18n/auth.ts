import type { Locale } from './locale'

export interface LoginCopy {
  title: string
  emailPlaceholder: string
  passwordPlaceholder: string
  submit: string
  submitting: string
  noAccount: string
  signUpLink: string
}

export interface SignupCopy {
  title: string
  emailPlaceholder: string
  passwordPlaceholder: string
  submit: string
  submitting: string
  haveAccount: string
  loginLink: string
  confirmationNotice: string
}

export const LOGIN_COPY: Record<Locale, LoginCopy> = {
  ar: {
    title: 'تسجيل الدخول',
    emailPlaceholder: 'البريد الإلكتروني',
    passwordPlaceholder: 'كلمة المرور',
    submit: 'تسجيل الدخول',
    submitting: 'جارٍ تسجيل الدخول…',
    noAccount: 'ليس لديك حساب؟',
    signUpLink: 'إنشاء حساب',
  },
  en: {
    title: 'Log in',
    emailPlaceholder: 'Email',
    passwordPlaceholder: 'Password',
    submit: 'Log in',
    submitting: 'Logging in…',
    noAccount: 'No account?',
    signUpLink: 'Sign up',
  },
  ur: {
    title: 'لاگ اِن',
    emailPlaceholder: 'ای میل',
    passwordPlaceholder: 'پاس ورڈ',
    submit: 'لاگ اِن',
    submitting: 'لاگ اِن ہو رہا ہے…',
    noAccount: 'اکاؤنٹ نہیں ہے؟',
    signUpLink: 'سائن اپ کریں',
  },
}

export const SIGNUP_COPY: Record<Locale, SignupCopy> = {
  ar: {
    title: 'إنشاء حساب',
    emailPlaceholder: 'البريد الإلكتروني',
    passwordPlaceholder: 'كلمة المرور (٦ أحرف على الأقل)',
    submit: 'إنشاء حساب',
    submitting: 'جارٍ الإنشاء…',
    haveAccount: 'لديك حساب بالفعل؟',
    loginLink: 'تسجيل الدخول',
    confirmationNotice: 'تحقق من بريدك الإلكتروني لتأكيد حسابك، ثم سجّل الدخول.',
  },
  en: {
    title: 'Create an account',
    emailPlaceholder: 'Email',
    passwordPlaceholder: 'Password (min 6 characters)',
    submit: 'Sign up',
    submitting: 'Creating account…',
    haveAccount: 'Already have an account?',
    loginLink: 'Log in',
    confirmationNotice: 'Check your email to confirm your account, then log in.',
  },
  ur: {
    title: 'اکاؤنٹ بنائیں',
    emailPlaceholder: 'ای میل',
    passwordPlaceholder: 'پاس ورڈ (کم از کم 6 حروف)',
    submit: 'سائن اپ کریں',
    submitting: 'اکاؤنٹ بن رہا ہے…',
    haveAccount: 'پہلے سے اکاؤنٹ ہے؟',
    loginLink: 'لاگ اِن',
    confirmationNotice: 'اپنے اکاؤنٹ کی تصدیق کے لیے اپنا ای میل چیک کریں، پھر لاگ اِن کریں۔',
  },
}
