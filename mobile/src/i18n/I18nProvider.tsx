import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getLocales } from 'expo-localization'
import {
  DASHBOARD_COPY,
  FORGOT_COPY,
  LOCALES,
  LOGIN_COPY,
  OWNER_UI_COPY,
  SIGNUP_COPY,
  isLocale,
  type Locale,
} from '../shared/web'
import { APP_COPY } from './appCopy'
import { secureStorage } from '../lib/storage'

// Same storage key name as the website's language choice.
const LOCALE_KEY = 'jeeran-locale'

function deviceLocale(): Locale {
  for (const l of getLocales()) {
    const code = (l.languageCode ?? '').toLowerCase()
    if (isLocale(code)) return code
  }
  return 'ar'
}

function build(locale: Locale) {
  const rtl = LOCALES.find((l) => l.code === locale)?.dir === 'rtl'
  return {
    locale,
    rtl,
    dir: rtl ? ('rtl' as const) : ('ltr' as const),
    // Physical alignment for text in this language (the app does not use
    // I18nManager: android:supportsRtl is off in app.json, so the native
    // layout is always LTR and the app mirrors itself from the language).
    align: rtl ? ('right' as const) : ('left' as const),
    // Horizontal rows run right-to-left in Arabic/Urdu. Rows use this
    // explicitly instead of the Yoga `direction` style, so the result is
    // the same on every Android version and on the web preview.
    row: rtl ? ('row-reverse' as const) : ('row' as const),
    dash: DASHBOARD_COPY[locale],
    ui: OWNER_UI_COPY[locale],
    app: APP_COPY[locale],
    login: LOGIN_COPY[locale],
    signup: SIGNUP_COPY[locale],
    forgot: FORGOT_COPY[locale],
    intl: locale === 'ar' ? 'ar-u-nu-latn' : locale === 'ur' ? 'ur-u-nu-latn' : 'en-GB',
  }
}

type I18n = ReturnType<typeof build> & { setLocale: (l: Locale) => void; ready: boolean }

const I18nContext = createContext<I18n | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(deviceLocale)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    secureStorage
      .getItem(LOCALE_KEY)
      .then((saved) => {
        if (isLocale(saved)) setLocaleState(saved)
      })
      .catch(() => {})
      .finally(() => setReady(true))
  }, [])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    secureStorage.setItem(LOCALE_KEY, l).catch(() => {})
  }, [])

  const value = useMemo(() => ({ ...build(locale), setLocale, ready }), [locale, setLocale, ready])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n outside I18nProvider')
  return ctx
}

export function formatDay(day: string, intl: string): string {
  const [y, m, d] = day.split('-').map(Number)
  try {
    return new Intl.DateTimeFormat(intl, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
      new Date(Date.UTC(y, m - 1, d)),
    )
  } catch {
    return day
  }
}
