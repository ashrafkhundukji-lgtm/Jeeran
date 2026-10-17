'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { CATEGORIES, CATEGORY_LABELS } from '@/lib/categories'
import { useLocale } from '@/lib/i18n/useLocale'
import { DASHBOARD_COPY } from '@/lib/i18n/dashboard'
import OwnerShell from '@/components/owner/OwnerShell'
import { BTN_CORAL, BTN_SECONDARY, HINT, INPUT, LABEL, Notice } from '@/components/owner/ui'
import { PRESS } from '@/components/customer/primitives'
import { AlertIcon, CategoryIcon, CheckIcon, ChevronBackIcon, NavigationIcon } from '@/components/customer/icons'

// Leaflet touches window/document at import time — must never run during SSR.
const LocationPicker = dynamic(() => import('@/components/LocationPicker'), {
  ssr: false,
  loading: () => <div className="skeleton h-full rounded-2xl" />,
})

const TOTAL_STEPS = 3
const MAP_HEIGHT = 300

// 3-step flow: (1) name + business name, (2) location — its own step since it
// needs the most screen and has the highest abandonment risk, (3) category.
// Still one POST /api/onboarding at the end. Re-skinned to the owner
// dashboard system (navy/coral/cream, stroke category icons, no emoji).
export default function OnboardingPage() {
  const router = useRouter()
  const [locale] = useLocale()
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
      { enableHighAccuracy: true, timeout: 10_000 },
    )
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')
    try {
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
    } catch {
      setError(copy.error)
      setLoading(false)
    }
  }

  function handleBack() {
    // Onboarding isn't mandatory to *leave* — a business-less owner just
    // lands right back here from /dashboard/owner's own redirect.
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
  const headings = [
    [copy.step1Heading, copy.step1Subtitle],
    [copy.step2Heading, copy.step2Subtitle],
    [copy.step3Heading, copy.step3Subtitle],
  ][step - 1]

  return (
    <OwnerShell
      tab={null}
      header={
        <header className="sticky top-0 z-20 flex min-h-[60px] items-center gap-3 border-b border-brand-line bg-brand-cream/95 px-3 backdrop-blur">
          <button
            type="button"
            onClick={handleBack}
            aria-label={DASHBOARD_COPY[locale].common.back}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-brand-navy active:bg-brand-tint ${PRESS}`}
          >
            <ChevronBackIcon size={24} />
          </button>
          <div className="flex flex-1 gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={TOTAL_STEPS} aria-valuenow={step}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full ${i < step ? 'bg-brand-navy' : 'bg-brand-line'}`} />
            ))}
          </div>
          <span className="shrink-0 pe-2 text-[13px] font-semibold text-brand-muted">{copy.stepCounter.replace('{n}', String(step))}</span>
        </header>
      }
      bottomBar={
        <div
          className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[480px] border-t border-brand-line bg-white px-4 pt-3 sm:border-x"
          style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}
        >
          <button type="button" onClick={handleContinue} disabled={!canContinue || loading} className={`${BTN_CORAL} w-full`}>
            {step < TOTAL_STEPS ? copy.continueButton : loading ? copy.savingSetup : copy.finishSetup}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-6 pt-2">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-[26px] leading-tight font-bold text-brand-navy-deep">{headings[0]}</h1>
          <p className="text-[15px] leading-relaxed text-brand-muted">{headings[1]}</p>
        </div>

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div>
              <label htmlFor="onb-name" className={LABEL}>
                {copy.yourName}
              </label>
              <input id="onb-name" dir="auto" required autoComplete="name" className={INPUT} value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div>
              <label htmlFor="onb-shop" className={LABEL}>
                {copy.businessName}
              </label>
              <input
                id="onb-shop"
                dir="auto"
                required
                autoComplete="organization"
                className={INPUT}
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-3">
            <div style={{ height: MAP_HEIGHT }}>
              <LocationPicker latitude={latitude} longitude={longitude} onChange={setLocation} height={MAP_HEIGHT} locateLabel={copy.useMyLocation} />
            </div>
            <button type="button" onClick={useMyLocation} disabled={locating} className={`${BTN_SECONDARY} w-full`}>
              <NavigationIcon size={18} />
              {locating ? copy.findingYou : copy.useMyLocation}
            </button>
            {latitude != null && (
              <p role="status" className="flex items-center gap-2 rounded-xl bg-brand-tint px-3 py-2.5 text-sm font-semibold text-brand-navy">
                <CheckIcon size={18} />
                {copy.locationSet}
              </p>
            )}
            <p className={HINT}>{copy.locationHint}</p>
          </div>
        )}

        {step === 3 && (
          <div role="radiogroup" aria-label={copy.category} className="grid grid-cols-2 gap-3">
            {CATEGORIES.map((c) => {
              const selected = category === c
              return (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setCategory(c)}
                  className={`flex min-h-[104px] flex-col items-center justify-center gap-2 rounded-[20px] border-2 p-3 text-center ${PRESS} ${
                    selected ? 'border-brand-navy bg-brand-tint' : 'border-brand-line bg-white'
                  }`}
                >
                  <CategoryIcon category={c} size={30} className="text-brand-navy" />
                  <span className="text-[15px] font-semibold text-brand-navy-deep">{CATEGORY_LABELS[locale][c]}</span>
                </button>
              )
            })}
          </div>
        )}

        {error && (
          <Notice tone="warning" icon={<AlertIcon size={20} />}>
            {error}
          </Notice>
        )}
      </div>
    </OwnerShell>
  )
}
