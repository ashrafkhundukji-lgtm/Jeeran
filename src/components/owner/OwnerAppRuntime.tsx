'use client'

import { useEffect } from 'react'
import { useLocale } from '@/lib/i18n/useLocale'
import { isLocale, LOCALE_STORAGE_KEY } from '@/lib/i18n/locale'
import { registerOwnerServiceWorker, syncPushLocale } from '@/lib/push/client'

// Mounted once by the owner layout (src/app/dashboard/layout.tsx), so the
// service worker is only ever registered from owner pages. Renders nothing.
export default function OwnerAppRuntime() {
  const [locale] = useLocale()

  useEffect(() => {
    registerOwnerServiceWorker()
  }, [])

  // useLocale() starts at 'ar' before it reads storage; read the stored
  // choice itself so a first render never sends the wrong language.
  useEffect(() => {
    let stored: string | null = null
    try {
      stored = localStorage.getItem(LOCALE_STORAGE_KEY)
    } catch {}
    syncPushLocale(isLocale(stored) ? stored : 'ar')
  }, [locale])

  return null
}
