'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { CATEGORIES, CATEGORY_LABELS } from '@/lib/categories'
import { useLocale } from '@/lib/i18n/useLocale'
import { DASHBOARD_COPY, type DashboardCopy } from '@/lib/i18n/dashboard'
import LanguageSwitcher from '@/components/LanguageSwitcher'

// Maps /api/profile's own known error strings to localized copy — same
// reasoning as CampaignManager's campaignErrorCopyFor. Anything not listed
// here (an unexpected 500, a raw Postgres error) falls back to copy.error.
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
  loading: () => <div className="h-[260px] rounded-lg bg-neutral-100 animate-pulse" />,
})

export default function ProfileForm({
  email,
  fullName: initialFullName,
  businessName: initialBusinessName,
  category: initialCategory,
  latitude: initialLatitude,
  longitude: initialLongitude,
}: {
  email: string
  fullName: string
  businessName: string
  category: string
  latitude: number | null
  longitude: number | null
}) {
  const router = useRouter()
  const [locale, setLocale] = useLocale()
  const copy = DASHBOARD_COPY[locale].profile

  const [fullName, setFullName] = useState(initialFullName)
  const [businessName, setBusinessName] = useState(initialBusinessName)
  const [category, setCategory] = useState(initialCategory)
  const [latitude, setLatitude] = useState<number | null>(initialLatitude)
  const [longitude, setLongitude] = useState<number | null>(initialLongitude)
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  function setLocation(lat: number, lng: number) {
    setLatitude(lat)
    setLongitude(lng)
  }

  function useMyLocation() {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation(pos.coords.latitude, pos.coords.longitude)
        setLocating(false)
      },
      () => setLocating(false),
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSaved(false)

    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, businessName, category, latitude, longitude }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(profileErrorCopyFor(body.error ?? '', copy))
      setLoading(false)
      return
    }

    setSaved(true)
    setLoading(false)
    router.refresh()
  }

  const inputClass = 'w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm'
  const labelClass = 'text-xs text-neutral-500 font-medium block mb-1'

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className={labelClass}>{copy.language}</label>
        <LanguageSwitcher locale={locale} onChange={setLocale} />
      </div>

      <div>
        <label className={labelClass}>{copy.email}</label>
        <input disabled value={email} className={`${inputClass} bg-neutral-50 text-neutral-400`} />
      </div>

      <div>
        <label className={labelClass}>{copy.yourName}</label>
        <input required className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </div>

      <div>
        <label className={labelClass}>{copy.businessName}</label>
        <input
          required
          className={inputClass}
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
        />
      </div>
      <div>
        <label className={labelClass}>{copy.category}</label>
        <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[locale][c]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className={labelClass + ' mb-0'}>{copy.location}</label>
          <button
            type="button"
            onClick={useMyLocation}
            disabled={locating}
            className="text-xs text-neutral-500 underline disabled:opacity-50"
          >
            {locating ? copy.findingYou : copy.useMyLocation}
          </button>
        </div>
        <p className="text-xs text-neutral-400 mb-2">{copy.locationHint}</p>
        <LocationPicker latitude={latitude} longitude={longitude} onChange={setLocation} />
        {latitude != null && longitude != null && <p className="text-xs text-emerald-600 mt-1.5">{copy.locationSet}</p>}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-emerald-600">{copy.saved}</p>}

      <button
        type="submit"
        disabled={loading}
        className="bg-[#FF6B4A] text-white rounded-lg py-2.5 text-sm font-medium transition-colors hover:bg-[#e85a3b] disabled:opacity-50"
      >
        {loading ? copy.saving : copy.save}
      </button>
    </form>
  )
}
