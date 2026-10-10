export type Locale = 'ar' | 'en' | 'ur'

export const LOCALES: { code: Locale; label: string; dir: 'rtl' | 'ltr' }[] = [
  { code: 'ar', label: 'العربية', dir: 'rtl' },
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'ur', label: 'اردو', dir: 'rtl' },
]

// Shared across landing/login/signup so a language choice made on one
// public page carries over to the others.
export const LOCALE_STORAGE_KEY = 'jeeran-locale'

export function getDir(locale: Locale): 'rtl' | 'ltr' {
  return LOCALES.find((l) => l.code === locale)?.dir ?? 'ltr'
}

export function isLocale(value: string | null): value is Locale {
  return value === 'ar' || value === 'en' || value === 'ur'
}

// Best guess at the phone's own language, for the wallet mini-site's
// "Automatic" setting. Checks the browser's preferred languages in order
// and takes the first one Jeeran supports; anything else falls back to
// Arabic (primary market), same default useLocale() already uses.
export function detectDeviceLocale(): Locale {
  const prefs = typeof navigator === 'undefined' ? [] : (navigator.languages ?? [navigator.language])
  for (const pref of prefs) {
    const code = pref?.toLowerCase().split('-')[0] ?? ''
    if (isLocale(code)) return code
  }
  return 'ar'
}
