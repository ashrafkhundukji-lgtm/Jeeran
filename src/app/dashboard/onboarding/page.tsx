'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { CATEGORIES, CATEGORY_LABELS, CATEGORY_EMOJI } from '@/lib/categories'
import { useLocale } from '@/lib/i18n/useLocale'
import { getDir } from '@/lib/i18n/locale'
import { DASHBOARD_COPY } from '@/lib/i18n/dashboard'

// Leaflet touches window/document at import time — must never run during SSR.
const LocationPicker = dynamic(() => import('@/components/LocationPicker'), {
  ssr: false,
  loading: () => <div className="h-full animate-pulse bg-neutral-100" />,
})

const TOTAL_STEPS = 3

// 3-step flow (design_handoff_jeeran_mobile/README.md §6), replacing the
// single-page form: (1) name + business name, (2) location — its own step
// since it needs the most screen and has the highest abandonment risk, (3)
// category. Still one POST /api/onboarding at the end, same as before — this
// is a presentation/pacing change, not a new multi-step mutation.
export default function OnboardingPage() {
  const router = useRouter()
  const [locale] = useLocale()
  const dir = getDir(locale)
  const copy = DASHBOARD_COPY[locale].onboarding

  const [step, setStep] = useState(1)
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

  async function handleSubmit() {
    setLoading(true)
    setError('')

    const res = await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, businessName, category, latitude, longitude }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error || copy.error)
      setLoading(false)
      return
    }

    router.push('/dashboard/owner')
    router.refresh()
  }

  function handleBack() {
    // Onboarding isn't mandatory to *leave* — a business-less owner just
    // lands right back here from /dashboard/owner's own redirect, so this is
    // a safe "exit" target on step 1 rather than a dead end.
    if (step === 1) {
      router.push('/dashboard/owner')
      return
    }
    setStep((s) => s - 1)
  }

  function handleContinue() {
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1)
      return
    }
    handleSubmit()
  }

  const step1Valid = fullName.trim() !== '' && businessName.trim() !== ''
  const canContinue = step === 1 ? step1Valid : true

  const inputClass = 'w-full border border-neutral-300 rounded-lg px-3 py-2.5 text-[15px]'
  const labelClass = 'text-xs text-neutral-500 font-medium block mb-1.5'

  return (
    <div dir={dir} className="flex min-h-dvh flex-col bg-white">
      {/* Header: back + progress + counter */}
      <div className="flex items-center gap-3 px-[18px] pt-2 pb-3.5">
        <button
          type="button"
          onClick={handleBack}
          aria-label={DASHBOARD_COPY[locale].common.back}
          className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-[#f4f4f4]"
        >
          <svg width="19" height="19" viewBox="0 0 16 16" fill="none" aria-hidden="true" className={dir === 'rtl' ? 'scale-x-[-1]' : ''}>
            <path d="M10 3.5L5.5 8L10 12.5" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="flex flex-1 gap-[5px]">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full ${i < step ? 'bg-[#FF6B4A]' : 'bg-[#ececec]'}`} />
          ))}
        </div>
        <span className="shrink-0 text-[12px] font-semibold text-[#8a8a8a]">{copy.stepCounter.replace('{n}', String(step))}</span>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-[22px] pt-1 pb-6">
        {step === 1 && (
          <>
            <h1 className="mb-2 text-[29px] font-black leading-[1.2] tracking-[-0.01em]">{copy.step1Heading}</h1>
            <p className="mb-6 text-[14.5px] leading-[1.6] text-[#5a5a5a]">{copy.step1Subtitle}</p>
            <div className="flex flex-col gap-4">
              <div>
                <label className={labelClass}>{copy.yourName}</label>
                <input required className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>{copy.businessName}</label>
                <input required className={inputClass} value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="mb-2 text-[29px] font-black leading-[1.2] tracking-[-0.01em]">{copy.step2Heading}</h1>
            <p className="mb-6 text-[14.5px] leading-[1.6] text-[#5a5a5a]">{copy.step2Subtitle}</p>
            <div className="rounded-[16px] border border-[#ececec] p-3.5">
              <div className="h-[210px] overflow-hidden rounded-[14px]">
                <LocationPicker latitude={latitude} longitude={longitude} onChange={setLocation} />
              </div>
              <div className="mt-[13px] flex items-center justify-between">
                <span className={`text-[12.5px] font-semibold ${latitude != null ? 'text-[#15803d]' : 'text-transparent'}`}>
                  {copy.locationSet}
                </span>
                <button type="button" onClick={useMyLocation} disabled={locating} className="text-[13px] font-semibold text-[#1E3A8A] disabled:opacity-50">
                  {locating ? copy.findingYou : copy.useMyLocation}
                </button>
              </div>
            </div>
            <p className="mt-3 text-[12.5px] leading-[1.6] text-[#a3a3a3]">{copy.locationHint}</p>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="mb-2 text-[29px] font-black leading-[1.2] tracking-[-0.01em]">{copy.step3Heading}</h1>
            <p className="mb-6 text-[14.5px] leading-[1.6] text-[#5a5a5a]">{copy.step3Subtitle}</p>
            <div className="grid grid-cols-2 gap-3">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`rounded-[16px] border p-4 text-center transition-colors ${
                    category === c ? 'border-2 border-[#FF6B4A] bg-[#FFF7F3]' : 'border-[#ececec]'
                  }`}
                >
                  <div className="mb-1.5 text-2xl">{CATEGORY_EMOJI[c]}</div>
                  <div className="text-[14px] font-medium">{CATEGORY_LABELS[locale][c]}</div>
                </button>
              ))}
            </div>
          </>
        )}

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </div>

      {/* Sticky footer */}
      <div className="border-t border-[#ececec] px-[22px] pt-3.5 pb-[26px]">
        <button
          type="button"
          onClick={handleContinue}
          disabled={!canContinue || loading}
          className="w-full rounded-[15px] bg-[#FF6B4A] py-4 text-[16px] font-semibold text-white transition-colors hover:bg-[#e85a3b] disabled:opacity-40"
        >
          {step < TOTAL_STEPS ? copy.continueButton : loading ? copy.savingSetup : copy.finishSetup}
        </button>
      </div>
    </div>
  )
}
