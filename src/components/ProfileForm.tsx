'use client'

import { useEffect, useId, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { CATEGORIES, CATEGORY_LABELS } from '@/lib/categories'
import { useLocale } from '@/lib/i18n/useLocale'
import { LOCALES, type Locale } from '@/lib/i18n/locale'
import { DASHBOARD_COPY, type DashboardCopy } from '@/lib/i18n/dashboard'
import { OWNER_UI_COPY, fill } from '@/lib/i18n/ownerUi'
import SignOutButton from '@/components/SignOutButton'
import { BTN_PRIMARY, Card, HINT, INPUT, LABEL } from '@/components/owner/ui'
import { AlertIcon, CheckIcon, ChevronDownIcon, NavigationIcon, PinIcon } from '@/components/customer/icons'

// Maps /api/profile's own known error strings to localized copy — same
// reasoning as campaignErrorCopyFor. Anything not listed here (an
// unexpected 500, a raw Postgres error) falls back to copy.error.
function profileErrorCopyFor(rawError: string, copy: DashboardCopy['profile']): string {
  switch (rawError) {
    case 'Not authenticated':
      return copy.errorNotAuthenticated
    case 'No business found for this account':
      return copy.errorNoBusiness
    case 'Name is required':
      return copy.errorNameRequired
    case 'Business name and category are required':
      return copy.errorBusinessRequired
    default:
      return copy.error
  }
}

// Leaflet touches window/document at import time — must never run during SSR.
const LocationPicker = dynamic(() => import('@/components/LocationPicker'), {
  ssr: false,
  loading: () => <div className="skeleton h-full rounded-2xl" />,
})

// Saudi numbers: mobile 05XXXXXXXX / +9665XXXXXXXX, landline 01X…. A hint
// only — never blocks saving, other countries are fine.
function looksSaudi(raw: string): boolean {
  const d = raw.replace(/[\s\-().]/g, '').replace(/^00/, '+')
  return /^(\+?966|0)?5\d{8}$/.test(d) || /^(\+?966|0)1\d{7,8}$/.test(d) || /^9200\d{5}$/.test(d)
}

const MAP_HEIGHT = 280

export default function ProfileForm({
  email,
  fullName: initialFullName,
  businessName: initialBusinessName,
  category: initialCategory,
  latitude: initialLatitude,
  longitude: initialLongitude,
  phone: initialPhone,
  whatsapp: initialWhatsapp,
}: {
  email: string
  fullName: string
  businessName: string
  category: string
  latitude: number | null
  longitude: number | null
  phone: string | null
  whatsapp: string | null
}) {
  const router = useRouter()
  const [locale, setLocale] = useLocale()
  const copy = DASHBOARD_COPY[locale].profile
  const p = OWNER_UI_COPY[locale].profile
  const ids = useId()

  const initial = {
    fullName: initialFullName,
    businessName: initialBusinessName,
    category: initialCategory,
    latitude: initialLatitude,
    longitude: initialLongitude,
    phone: initialPhone ?? '',
    whatsapp: initialWhatsapp ?? '',
  }
  const [saved, setSaved] = useState(initial)
  const [form, setForm] = useState(initial)
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState('')
  const [justSaved, setJustSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [k]: v }))
    setJustSaved(false)
  }
  const isDirty = (Object.keys(form) as (keyof typeof form)[]).some((k) => form[k] !== saved[k])

  useEffect(() => {
    if (!justSaved) return
    const t = setTimeout(() => setJustSaved(false), 3000)
    return () => clearTimeout(t)
  }, [justSaved])

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) e.preventDefault()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [isDirty])

  function useMyLocation() {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({ ...f, latitude: pos.coords.latitude, longitude: pos.coords.longitude }))
        setLocating(false)
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10_000 },
    )
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(profileErrorCopyFor(body.error ?? '', copy))
        return
      }
      setSaved(form)
      setJustSaved(true)
      router.refresh()
    } catch {
      setError(OWNER_UI_COPY[locale].common.errorBody)
    } finally {
      setLoading(false)
    }
  }

  const hasCoords = form.latitude != null && form.longitude != null
  const coordsChanged = form.latitude !== saved.latitude || form.longitude !== saved.longitude
  const coords = hasCoords ? { lat: form.latitude!.toFixed(5), lng: form.longitude!.toFixed(5) } : null

  const field = (key: 'fullName' | 'businessName', label: string) => (
    <div>
      <label htmlFor={`${ids}-${key}`} className={LABEL}>
        {label}
      </label>
      <input
        id={`${ids}-${key}`}
        dir="auto"
        required
        value={form[key]}
        onChange={(e) => set(key, e.target.value)}
        autoComplete={key === 'fullName' ? 'name' : 'organization'}
        className={INPUT}
      />
    </div>
  )

  const phoneField = (key: 'phone' | 'whatsapp', label: string) => {
    const warn = form[key].trim() !== '' && !looksSaudi(form[key])
    return (
      <div>
        <label htmlFor={`${ids}-${key}`} className={LABEL}>
          {label}
        </label>
        <input
          id={`${ids}-${key}`}
          type="tel"
          inputMode="tel"
          dir="ltr"
          autoComplete="tel"
          value={form[key]}
          onChange={(e) => set(key, e.target.value)}
          aria-describedby={`${ids}-${key}-hint`}
          className={`${INPUT} text-start rtl:text-right`}
        />
        <p id={`${ids}-${key}-hint`} className={`${HINT} ${warn ? 'flex items-start gap-1.5 font-medium text-brand-coral' : ''}`}>
          {warn && <AlertIcon size={15} className="mt-0.5 shrink-0" />}
          {warn ? p.phoneNotSaudi : p.phoneHint}
        </p>
      </div>
    )
  }

  return (
    <>
      <form id={`${ids}-form`} onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Shop */}
        <section>
          <h2 className="mb-2.5 font-display text-[17px] font-semibold">{p.shopHeading}</h2>
          <Card className="flex flex-col gap-4 p-4">
            {field('businessName', copy.businessName)}
            <div>
              <label htmlFor={`${ids}-category`} className={LABEL}>
                {copy.category}
              </label>
              <div className="relative">
                <select
                  id={`${ids}-category`}
                  value={form.category}
                  onChange={(e) => set('category', e.target.value)}
                  className={`${INPUT} appearance-none pe-11`}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABELS[locale][c]}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon size={20} className="pointer-events-none absolute end-3.5 top-1/2 -translate-y-1/2 text-brand-navy" />
              </div>
            </div>
            {field('fullName', copy.yourName)}
          </Card>
        </section>

        {/* Contact */}
        <section id="contact" className="scroll-mt-20">
          <h2 className="mb-2.5 font-display text-[17px] font-semibold">{p.contactHeading}</h2>
          <Card className="flex flex-col gap-4 p-4">
            {phoneField('phone', copy.phone)}
            {phoneField('whatsapp', copy.whatsapp)}
            <p className="text-[13px] leading-relaxed text-brand-muted">{copy.contactHint}</p>
          </Card>
        </section>

        {/* Location */}
        <section>
          <h2 className="mb-2.5 font-display text-[17px] font-semibold">{p.locationHeading}</h2>
          <Card className="flex flex-col gap-3 p-4">
            <p className="text-[13px] leading-relaxed text-brand-muted">{p.mapHint}</p>
            <div style={{ height: MAP_HEIGHT }}>
              <LocationPicker
                latitude={form.latitude}
                longitude={form.longitude}
                onChange={(lat, lng) => setForm((f) => ({ ...f, latitude: lat, longitude: lng }))}
                height={MAP_HEIGHT}
                locateLabel={copy.useMyLocation}
              />
            </div>
            <button type="button" onClick={useMyLocation} disabled={locating} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border-[1.5px] border-brand-tint-2 bg-white px-4 text-[15px] font-semibold text-brand-navy disabled:opacity-60">
              <NavigationIcon size={18} />
              {locating ? copy.findingYou : copy.useMyLocation}
            </button>
            <p
              role="status"
              className={`flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold ${
                !hasCoords ? 'bg-brand-coral-tint text-brand-coral' : coordsChanged ? 'bg-brand-tint text-brand-navy' : 'bg-brand-tint text-brand-navy'
              }`}
            >
              {hasCoords && !coordsChanged ? <CheckIcon size={18} className="mt-0.5 shrink-0" /> : <PinIcon size={18} className="mt-0.5 shrink-0" />}
              <span>{coords ? <bdi>{fill(coordsChanged ? p.coordsUnsaved : p.coordsSaved, coords)}</bdi> : p.coordsNone}</span>
            </p>
          </Card>
        </section>
      </form>

      {/* Language — applies immediately, not part of the save bar */}
      <section className="mt-6">
        <h2 className="mb-2.5 font-display text-[17px] font-semibold">{p.languageHeading}</h2>
        <div role="radiogroup" aria-label={copy.language} className="grid grid-cols-3 gap-2">
          {LOCALES.map((l) => {
            const active = l.code === locale
            return (
              <button
                key={l.code}
                type="button"
                role="radio"
                aria-checked={active}
                lang={l.code}
                onClick={() => setLocale(l.code as Locale)}
                className={`min-h-12 rounded-2xl border-[1.5px] text-[15px] font-semibold ${
                  active ? 'border-brand-navy bg-brand-navy text-white' : 'border-brand-line bg-white text-brand-navy-deep'
                }`}
              >
                {l.label}
              </button>
            )
          })}
        </div>
      </section>

      {/* Account */}
      <section className="mt-6">
        <h2 className="mb-2.5 font-display text-[17px] font-semibold">{p.accountHeading}</h2>
        <Card className="p-4">
          <p className="text-[13px] text-brand-muted">{copy.email}</p>
          <p className="mb-3 truncate text-[15px] font-semibold" dir="ltr">
            {email}
          </p>
          <div className="border-t border-brand-line pt-2 text-center">
            <SignOutButton className="min-h-11 w-full rounded-xl text-[15px] font-semibold text-brand-coral" />
          </div>
        </Card>
      </section>

      {/* Sticky save bar — only while something changed (or right after a save / on error) */}
      {(isDirty || justSaved || error) && (
        <div
          className="fixed inset-x-0 z-[1050] mx-auto w-full max-w-[480px] px-3"
          style={{ bottom: 'calc(64px + 8px + env(safe-area-inset-bottom, 0px))' }}
        >
          <div role="status" aria-live="polite" className="flex items-center gap-2 rounded-2xl bg-brand-navy-deep p-2 ps-4 text-white shadow-brand-overlap">
            {error ? (
              <span className="flex min-w-0 flex-1 items-center gap-2 text-sm font-semibold">
                <AlertIcon size={18} className="shrink-0 text-brand-coral-brand" />
                {error}
              </span>
            ) : justSaved && !isDirty ? (
              <span className="flex flex-1 items-center gap-2 text-sm font-semibold">
                <CheckIcon size={18} strokeWidth={2.6} />
                {p.saved}
              </span>
            ) : (
              <span className="min-w-0 flex-1 text-sm font-semibold">{p.dirtyBar}</span>
            )}
            {isDirty && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setForm(saved)
                    setError('')
                  }}
                  disabled={loading}
                  className="min-h-11 shrink-0 rounded-xl px-3 text-sm font-semibold text-white/80"
                >
                  {p.discard}
                </button>
                <button type="submit" form={`${ids}-form`} disabled={loading} className={`${BTN_PRIMARY} !min-h-11 shrink-0 !bg-white !px-4 !text-brand-navy`}>
                  {loading ? copy.saving : copy.save}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
