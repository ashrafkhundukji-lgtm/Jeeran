'use client'

import { useEffect, useState } from 'react'
import { LOCALE_STORAGE_KEY, isLocale, type Locale } from './locale'

// Defaults to Arabic (primary market language) until we know better — reads
// localStorage after mount to avoid a server/client render mismatch.
export function useLocale(defaultLocale: Locale = 'ar') {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)

  useEffect(() => {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (isLocale(saved)) setLocaleState(saved)
  }, [])

  function setLocale(next: Locale) {
    setLocaleState(next)
    localStorage.setItem(LOCALE_STORAGE_KEY, next)
  }

  return [locale, setLocale] as const
}
