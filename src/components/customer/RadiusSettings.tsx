'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Locale } from '@/lib/i18n/locale'
import { RADIUS_SETTINGS_COPY } from '@/lib/i18n/radiusSettings'
import { RADIUS_OPTIONS_KM, nextRadius } from '@/lib/wallet/radius'
import { AlertIcon, CheckIcon, ChevronForwardIcon, NavigationIcon, PinIcon } from './icons'
import { PRESS } from './primitives'
import { EmptyState, NoOffersState } from './States'

// Customer radius + location controls. Everything goes through
// /api/wallet/membership/preferences with the page's signed member token
// (same identity as every other wallet page); on success the page's server
// data is re-fetched (router.refresh) so lists and counts follow at once.

type Outcome = { ok: true; cardUpdated: boolean | null } | { ok: false; status: number }

async function savePreferences(token: string, change: { radiusKm?: number; lat?: number; lng?: number }): Promise<Outcome> {
  try {
    const res = await fetch('/api/wallet/membership/preferences', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token, ...change }),
    })
    if (!res.ok) return { ok: false, status: res.status }
    const body = (await res.json()) as { cardUpdated: boolean | null }
    return { ok: true, cardUpdated: body.cardUpdated }
  } catch {
    return { ok: false, status: 0 }
  }
}

type Status = { tone: 'ok' | 'error'; text: string } | null

function StatusLine({ status }: { status: Status }) {
  if (!status) return null
  return (
    <p
      role={status.tone === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-2 text-sm leading-relaxed ${status.tone === 'error' ? 'text-brand-coral' : 'text-brand-navy'}`}
    >
      {status.tone === 'error' ? <AlertIcon size={18} className="mt-0.5 shrink-0" /> : <CheckIcon size={18} className="mt-0.5 shrink-0" />}
      <span>{status.text}</span>
    </p>
  )
}

// Full section on /wallet/home (id="radius" — the Wallet card's "Widen"
// link and the Shops tab's entry row jump here).
export default function RadiusSettings({ token, radiusKm, locale }: { token: string; radiusKm: number; locale: Locale }) {
  const copy = RADIUS_SETTINGS_COPY[locale]
  const router = useRouter()
  const [selected, setSelected] = useState(radiusKm)
  const [busy, setBusy] = useState<'radius' | 'location' | null>(null)
  const [radiusStatus, setRadiusStatus] = useState<Status>(null)
  const [locationStatus, setLocationStatus] = useState<Status>(null)

  const failText = (status: number) => (status === 429 ? copy.tooMany : copy.saveError)
  const okText = (cardUpdated: boolean | null, text: string) => (cardUpdated === false ? copy.savedCardLater : text)

  async function chooseRadius(km: number) {
    if (busy || km === selected) return
    const previous = selected
    setSelected(km)
    setBusy('radius')
    setRadiusStatus(null)
    const result = await savePreferences(token, { radiusKm: km })
    setBusy(null)
    if (!result.ok) {
      setSelected(previous)
      setRadiusStatus({ tone: 'error', text: failText(result.status) })
      return
    }
    setRadiusStatus({ tone: 'ok', text: okText(result.cardUpdated, copy.saved) })
    router.refresh()
  }

  function updateLocation() {
    if (busy) return
    setLocationStatus(null)
    if (!navigator.geolocation) {
      setLocationStatus({ tone: 'error', text: copy.locationUnavailable })
      return
    }
    setBusy('location')
    // Nothing is sent unless the browser actually returns a position, so a
    // denied or timed-out request can never overwrite the saved location.
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const result = await savePreferences(token, { lat: pos.coords.latitude, lng: pos.coords.longitude })
        setBusy(null)
        if (!result.ok) {
          setLocationStatus({ tone: 'error', text: failText(result.status) })
          return
        }
        setLocationStatus({ tone: 'ok', text: okText(result.cardUpdated, copy.locationUpdated) })
        router.refresh()
      },
      (err) => {
        setBusy(null)
        const text =
          err.code === err.PERMISSION_DENIED ? copy.locationDenied : err.code === err.TIMEOUT ? copy.locationTimeout : copy.locationUnavailable
        setLocationStatus({ tone: 'error', text })
      },
      { timeout: 10_000, maximumAge: 0, enableHighAccuracy: false },
    )
  }

  return (
    <section id="radius" aria-labelledby="radius-heading" className="flex scroll-mt-6 flex-col gap-3 rounded-[22px] border border-brand-line bg-white p-4">
      <div className="flex flex-col gap-1">
        <h2 id="radius-heading" className="flex items-center gap-2 font-display text-lg font-semibold text-brand-navy-deep">
          <PinIcon size={20} className="text-brand-coral" />
          {copy.heading}
        </h2>
        <p className="text-sm leading-relaxed text-brand-muted">{copy.helper}</p>
      </div>

      <div role="radiogroup" aria-labelledby="radius-heading" className="grid grid-cols-4 gap-2">
        {RADIUS_OPTIONS_KM.map((km) => {
          const checked = selected === km
          return (
            <button
              key={km}
              type="button"
              role="radio"
              aria-checked={checked}
              disabled={busy === 'location'}
              onClick={() => chooseRadius(km)}
              className={`h-11 rounded-xl border text-sm font-semibold transition-colors ${PRESS} ${
                checked ? 'border-brand-navy bg-brand-navy text-white' : 'border-brand-line bg-white text-brand-navy-deep'
              }`}
            >
              <bdi>{copy.km(km)}</bdi>
            </button>
          )
        })}
      </div>
      {busy === 'radius' ? <p className="text-sm text-brand-muted">{copy.saving}</p> : <StatusLine status={radiusStatus} />}

      <div className="flex flex-col gap-2 border-t border-brand-line pt-3">
        <button
          type="button"
          onClick={updateLocation}
          disabled={busy !== null}
          className={`inline-flex h-12 items-center justify-center gap-2 rounded-2xl border-[1.5px] border-brand-tint-2 px-5 text-[15px] font-semibold text-brand-navy disabled:opacity-60 ${PRESS}`}
        >
          <NavigationIcon size={18} />
          {busy === 'location' ? copy.locating : copy.updateLocation}
        </button>
        <StatusLine status={locationStatus} />
        <p className="text-xs leading-relaxed text-brand-muted">{copy.privacy}</p>
      </div>
    </section>
  )
}

// "No offers within X km" with a one-tap "Widen to Y km". Never widens on
// its own. At the widest step there is nothing to widen to, so it falls
// back to the existing "invite a shop" empty state.
export function WidenRadiusState({ token, radiusKm, locale }: { token: string; radiusKm: number; locale: Locale }) {
  const copy = RADIUS_SETTINGS_COPY[locale]
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const next = nextRadius(radiusKm)
  if (!next) return <NoOffersState locale={locale} />

  async function widen() {
    if (busy || !next) return
    setBusy(true)
    setError(null)
    const result = await savePreferences(token, { radiusKm: next })
    setBusy(false)
    if (!result.ok) {
      setError(result.status === 429 ? copy.tooMany : copy.saveError)
      return
    }
    router.refresh()
  }

  return (
    <EmptyState
      icon={<PinIcon size={30} />}
      title={copy.emptyTitle(radiusKm)}
      body={error ?? copy.emptyBody}
      action={
        <button
          type="button"
          onClick={widen}
          disabled={busy}
          className={`mt-1 inline-flex h-12 items-center gap-2 rounded-2xl bg-brand-navy px-5 text-[15px] font-semibold text-white disabled:opacity-70 ${PRESS}`}
        >
          {busy ? copy.widening : copy.widen(next)}
        </button>
      }
    />
  )
}

// Compact row for the Shops tab: current radius, links to the full section.
export function RadiusEntry({ token, radiusKm, locale }: { token: string; radiusKm: number; locale: Locale }) {
  const copy = RADIUS_SETTINGS_COPY[locale]
  return (
    <a
      href={`/wallet/home?token=${encodeURIComponent(token)}#radius`}
      className={`flex min-h-11 items-center gap-2 rounded-2xl border border-brand-line bg-white px-3.5 py-2 text-sm ${PRESS}`}
    >
      <PinIcon size={18} className="shrink-0 text-brand-coral" />
      <span className="flex-1 font-semibold text-brand-navy-deep">{copy.compact(radiusKm)}</span>
      <span className="font-semibold text-brand-coral">{copy.change}</span>
      <ChevronForwardIcon size={18} className="text-brand-coral" />
    </a>
  )
}
