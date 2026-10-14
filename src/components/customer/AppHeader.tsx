'use client'

import { useEffect, useState } from 'react'
import type { Locale } from '@/lib/i18n/locale'
import { CUSTOMER_UI_COPY } from '@/lib/i18n/customerUi'
import { WALLET_HOME_COPY } from '@/lib/i18n/walletHome'
import { PinIcon } from './icons'
import { PRESS } from './primitives'

export type GeoState = 'unknown' | 'granted' | 'prompt' | 'denied'

// Reads the browser's geolocation permission without prompting, and
// exposes request() to ask for it. Display only — the position itself is
// not sent anywhere (no reverse-geocoding, no new API; see the brief).
export function useGeoPermission() {
  const [state, setState] = useState<GeoState>('unknown')

  useEffect(() => {
    let status: PermissionStatus | null = null
    const update = () => status && setState(status.state as GeoState)
    navigator.permissions
      ?.query({ name: 'geolocation' })
      .then((s) => {
        status = s
        update()
        s.addEventListener('change', update)
      })
      .catch(() => setState('prompt'))
    return () => status?.removeEventListener('change', update)
  }, [])

  function request() {
    if (!navigator.geolocation) {
      setState('denied')
      return
    }
    navigator.geolocation.getCurrentPosition(
      () => setState('granted'),
      () => setState('denied'),
      { timeout: 8000, maximumAge: 60_000 },
    )
  }

  return { state, request }
}

// Wordmark + location status chip. "Your location" once geolocation is
// granted, otherwise a tappable "Turn on location" prompt.
export default function AppHeader({ locale, geo, onRequestGeo }: { locale: Locale; geo: GeoState; onRequestGeo: () => void }) {
  const copy = CUSTOMER_UI_COPY[locale].home
  const chip = 'flex h-11 items-center gap-1.5 rounded-full border border-brand-line bg-white px-3.5 text-[13px] font-semibold'

  return (
    <header className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/design/jeeran-mark-navy.svg" alt="" className="h-[34px] w-[34px]" />
        <span className="font-display text-[22px] font-bold text-brand-navy-deep">{WALLET_HOME_COPY[locale].brand}</span>
      </div>
      {geo === 'granted' ? (
        <span className={chip}>
          <PinIcon size={16} strokeWidth={2.2} className="text-brand-coral" />
          {copy.locationCurrent}
        </span>
      ) : geo === 'unknown' ? (
        <span className={`${chip} invisible`} aria-hidden="true">
          {copy.locationCurrent}
        </span>
      ) : (
        <button type="button" onClick={onRequestGeo} className={`${chip} text-brand-coral ${PRESS}`}>
          <PinIcon size={16} strokeWidth={2.2} />
          {copy.locationEnable}
        </button>
      )}
    </header>
  )
}
