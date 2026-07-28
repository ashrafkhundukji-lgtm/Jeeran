'use client'

import { useEffect, useState } from 'react'
import { LOCALE_STORAGE_KEY, isLocale, type Locale } from './locale'

// Fires whenever any useLocale() instance changes the locale, so every other
// mounted instance on the same page (e.g. DashboardNav alongside the Profile
// page's language picker) updates immediately instead of only on next
// navigation/reload.
const LOCALE_CHANGE_EVENT = 'jeeran-locale-change'

// Defaults to Arabic (primary market language) until we know better — reads
// localStorage after mount to avoid a server/client render mismatch.
export function useLocale(defaultLocale: Locale = 'ar') {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)

  useEffect(() => {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (isLocale(saved)) setLocaleState(saved)

    function handleChange(e: Event) {
      const next = (e as CustomEvent<Locale>).detail
      if (isLocale(next)) setLocaleState(next)
    }
    window.addEventListener(LOCALE_CHANGE_EVENT, handleChange)
    return () => window.removeEventListener(LOCALE_CHANGE_EVENT, handleChange)
  }, [])

  function setLocale(next: Locale) {
    setLocaleState(next)
    localStorage.setItem(LOCALE_STORAGE_KEY, next)
    window.dispatchEvent(new CustomEvent(LOCALE_CHANGE_EVENT, { detail: next }))
  }

  return [locale, setLocale] as const
}
