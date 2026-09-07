'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { CATEGORIES, CATEGORY_LABELS } from '@/lib/categories'
import { useLocale } from '@/lib/i18n/useLocale'
import { getDir, LOCALES, type Locale } from '@/lib/i18n/locale'
import { DASHBOARD_COPY, type DashboardCopy } from '@/lib/i18n/dashboard'
import OwnerAppBar from '@/components/OwnerAppBar'
import SignOutButton from '@/components/SignOutButton'

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
  loading: () => <div className="h-full animate-pulse bg-neutral-100" />,
})

function ChevronIcon({ dir }: { dir: 'ltr' | 'rtl' }) {
  return (
    <svg width="17" height="17" viewBox="0 0 16 16" fill="none" aria-hidden="true" className={dir === 'rtl' ? '' : 'scale-x-[-1]'}>
      <path d="M10 3.5L5.5 8L10 12.5" stroke="#c9c9c9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Shared single-select bottom sheet for the category and language rows below
// — both are a simple "pick one from a short list" interaction, so one
// generic implementation covers both rather than two bespoke ones.
function SelectSheet({
  title,
  options,
  selected,
  onSelect,
  onClose,
  dir,
}: {
  title: string
  options: { value: string; label: string }[]
  selected: string
  onSelect: (value: string) => void
  onClose: () => void
  dir: 'ltr' | 'rtl'
}) {
  return (
    // z-[1100]: Leaflet's own panes/controls (LocationPicker's map, mounted
    // behind this sheet on the same page) go up to z-index 1000 — a
    // Tailwind z-30 sheet was rendering underneath the map instead of over it.
    <div className="fixed inset-0 z-[1100] flex items-end bg-black/40" onClick={onClose}>
      <div
        dir={dir}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[70vh] w-full overflow-y-auto rounded-[28px_28px_0_0] bg-white p-5 pb-8"
      >
        <div className="mx-auto mb-4 h-1 w-[38px] rounded-full bg-[#e5e5e5]" />
        <h2 className="mb-3 text-[16px] font-semibold">{title}</h2>
        <div className="flex flex-col">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onSelect(opt.value)}
              className="flex items-center justify-between border-b border-[#f4f4f4] py-3.5 text-start text-[15px] last:border-b-0"
            >
              {opt.label}
              {opt.value === selected && (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8.5l3 3 7-7" stroke="#FF6B4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

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
  const dir = getDir(locale)
  const copy = DASHBOARD_COPY[locale].profile

  const [fullName, setFullName] = useState(initialFullName)
  const [businessName, setBusinessName] = useState(initialBusinessName)
  const [category, setCategory] = useState(initialCategory)
  const [latitude, setLatitude] = useState<number | null>(initialLatitude)
  const [longitude, setLongitude] = useState<number | null>(initialLongitude)
  const [phone, setPhone] = useState(initialPhone ?? '')
  const [whatsapp, setWhatsapp] = useState(initialWhatsapp ?? '')
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showCategorySheet, setShowCategorySheet] = useState(false)
  const [showLanguageSheet, setShowLanguageSheet] = useState(false)

  const isDirty =
    fullName !== initialFullName ||
    businessName !== initialBusinessName ||
    category !== initialCategory ||
    latitude !== initialLatitude ||
    longitude !== initialLongitude ||
    phone !== (initialPhone ?? '') ||
    whatsapp !== (initialWhatsapp ?? '')

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

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    setLoading(true)
    setError('')
    setSaved(false)

    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, businessName, category, latitude, longitude, phone, whatsapp }),
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

  // Phone/WhatsApp numbers must render LTR (a leading "+" and digit groups
  // get bidi-reordered inside an RTL form otherwise), but keep the field
  // aligned to the surrounding form's edge rather than always flipping to
  // the left, so the field doesn't visually jump out of line with the
  // labels/inputs above and below it.
  const phoneAlignClass = dir === 'rtl' ? 'text-right' : 'text-left'

  return (
    <>
      <OwnerAppBar
        variant="subpage"
        dir={dir}
        title={copy.heading}
        backHref="/dashboard/owner"
        backLabel={DASHBOARD_COPY[locale].common.back}
        trailingAction={{ label: loading ? copy.saving : copy.save, onClick: () => handleSubmit(), disabled: !isDirty || loading }}
      />

      <form onSubmit={handleSubmit} className="px-[18px] pt-[22px]">
        {/* Identity block */}
        <div className="mb-[26px] flex items-center gap-[14px]">
          <div className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-full bg-[#1E3A8A] text-[22px] font-bold text-white">
            {(fullName || businessName || email).trim().charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="truncate text-[17px] font-semibold">{fullName}</div>
            <div className="mt-[3px] truncate text-[13px] text-[#8a8a8a]">{email}</div>
          </div>
        </div>

        {/* Shop group */}
        <h2 className="mb-[9px] text-[12px] font-semibold tracking-[0.06em] text-[#8a8a8a]">{copy.shopSectionLabel}</h2>
        <div className="mb-[22px] overflow-hidden rounded-[18px] border border-[#ececec] bg-white">
          <div className="border-b border-[#f4f4f4] px-4 py-3">
            <label className="mb-[3px] block text-[11.5px] text-[#a3a3a3]">{copy.yourName}</label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full text-[15px] font-medium outline-none"
            />
          </div>
          <div className="border-b border-[#f4f4f4] px-4 py-3">
            <label className="mb-[3px] block text-[11.5px] text-[#a3a3a3]">{copy.businessName}</label>
            <input
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full text-[15px] font-medium outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowCategorySheet(true)}
            className="flex w-full items-center justify-between border-b border-[#f4f4f4] px-4 py-3 text-start"
          >
            <div>
              <div className="mb-[3px] text-[11.5px] text-[#a3a3a3]">{copy.category}</div>
              <div className="text-[15px] font-medium">{CATEGORY_LABELS[locale][category] ?? category}</div>
            </div>
            <ChevronIcon dir={dir} />
          </button>
          <div className="px-4 py-3">
            <div className="mb-[9px] flex items-center justify-between">
              <span className="text-[11.5px] text-[#a3a3a3]">{copy.location}</span>
              <button type="button" onClick={useMyLocation} disabled={locating} className="text-[12px] font-semibold text-[#1E3A8A] disabled:opacity-50">
                {locating ? copy.findingYou : copy.useMyLocation}
              </button>
            </div>
            <div className="h-[104px] overflow-hidden rounded-[13px]">
              <LocationPicker latitude={latitude} longitude={longitude} onChange={setLocation} />
            </div>
            {latitude != null && longitude != null && (
              <p className="mt-[9px] text-[12.5px] font-semibold text-[#15803d]">{copy.locationSet}</p>
            )}
          </div>
        </div>

        {/* Contact group */}
        <h2 className="mb-[9px] text-[12px] font-semibold tracking-[0.06em] text-[#8a8a8a]">{copy.contactSectionLabel}</h2>
        <div className="overflow-hidden rounded-[18px] border border-[#ececec] bg-white">
          <div className="border-b border-[#f4f4f4] px-4 py-3">
            <label className="mb-[3px] block text-[11.5px] text-[#a3a3a3]">{copy.phone}</label>
            <input
              type="tel"
              dir="ltr"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={copy.phonePlaceholder}
              className={`w-full text-[15px] font-medium outline-none placeholder:font-normal placeholder:text-[#a3a3a3] ${phoneAlignClass}`}
            />
          </div>
          <div className="px-4 py-3">
            <label className="mb-[3px] block text-[11.5px] text-[#a3a3a3]">{copy.whatsapp}</label>
            <input
              type="tel"
              dir="ltr"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder={copy.whatsappPlaceholder}
              className={`w-full text-[15px] font-medium outline-none placeholder:font-normal placeholder:text-[#a3a3a3] ${phoneAlignClass}`}
            />
          </div>
        </div>
        <p className="mb-[22px] mt-2 text-[12px] leading-[1.6] text-[#a3a3a3]">{copy.contactHint}</p>

        {/* Language row */}
        <button
          type="button"
          onClick={() => setShowLanguageSheet(true)}
          className="mb-[22px] flex w-full items-center justify-between rounded-[18px] border border-[#ececec] bg-white px-4 py-[15px]"
        >
          <span className="text-[14.5px] font-medium">{copy.language}</span>
          <span className="flex items-center gap-2 text-[13px] text-[#8a8a8a]">
            {LOCALES.find((l) => l.code === locale)?.label}
            <ChevronIcon dir={dir} />
          </span>
        </button>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        {saved && <p className="mb-3 text-sm text-emerald-600">{copy.saved}</p>}

        {/* Sign out */}
        <div className="mb-8 rounded-[18px] border border-[#ececec] bg-white p-[14px] text-center">
          <SignOutButton className="text-[14.5px] font-semibold text-[#dc2626]" />
        </div>
      </form>

      {showCategorySheet && (
        <SelectSheet
          dir={dir}
          title={copy.categoryPicker}
          options={CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[locale][c] }))}
          selected={category}
          onSelect={(v) => {
            setCategory(v)
            setShowCategorySheet(false)
          }}
          onClose={() => setShowCategorySheet(false)}
        />
      )}
      {showLanguageSheet && (
        <SelectSheet
          dir={dir}
          title={copy.languagePicker}
          options={LOCALES.map((l) => ({ value: l.code, label: l.label }))}
          selected={locale}
          onSelect={(v) => {
            setLocale(v as Locale)
            setShowLanguageSheet(false)
          }}
          onClose={() => setShowLanguageSheet(false)}
        />
      )}
    </>
  )
}
