'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import SiteLogo from '@/components/SiteLogo'
import { CATEGORIES } from '@/lib/categories'

// Leaflet touches window/document at import time — must never run during SSR.
const LocationPicker = dynamic(() => import('@/components/LocationPicker'), {
  ssr: false,
  loading: () => <div className="h-[260px] rounded-lg bg-neutral-100 animate-pulse" />,
})

export default function OnboardingPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState('')
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

    const res = await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName,
        businessName,
        category,
        latitude,
        longitude,
      }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error || 'Something went wrong')
      setLoading(false)
      return
    }

    router.push('/dashboard/owner')
    router.refresh()
  }

  const inputClass = 'w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm'
  const labelClass = 'text-xs text-neutral-500 font-medium block mb-1'

  return (
    <main className="max-w-md mx-auto px-4 py-12">
      <SiteLogo className="h-20 mb-6" />
      <h1 className="text-xl font-semibold mb-1">Welcome to Jeeran Network</h1>
      <p className="text-sm text-neutral-500 mb-6">Tell us a bit about yourself to get started.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className={labelClass}>Your name</label>
          <input required className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>

        <div>
          <label className={labelClass}>Business name</label>
          <input required className={inputClass} value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Category</label>
          <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className={labelClass + ' mb-0'}>Location</label>
            <button
              type="button"
              onClick={useMyLocation}
              disabled={locating}
              className="text-xs text-neutral-500 underline disabled:opacity-50"
            >
              {locating ? 'Finding you…' : 'Use my current location'}
            </button>
          </div>
          <p className="text-xs text-neutral-400 mb-2">Tap the map to drop a pin on your shop, or drag it to adjust.</p>
          <LocationPicker latitude={latitude} longitude={longitude} onChange={setLocation} />
          {latitude != null && longitude != null && (
            <p className="text-xs text-emerald-600 mt-1.5">📍 Location set</p>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-[#FF6B4A] text-white rounded-lg py-2.5 text-sm font-medium transition-colors hover:bg-[#e85a3b] disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Finish setup'}
        </button>
      </form>
    </main>
  )
}
