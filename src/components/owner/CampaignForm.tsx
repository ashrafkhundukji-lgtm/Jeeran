'use client'

import { useEffect, useId, useRef, useState } from 'react'
import OwnerShell, { OwnerTopBar } from './OwnerShell'
import Sheet from './Sheet'
import DateField, { addDays, todayStr } from './DateField'
import { downscaleImage, ImageDecodeError } from './imageResize'
import type { OwnerCampaign } from './campaigns'
import { BTN_CORAL, BTN_PRIMARY, BTN_SECONDARY, Card, ERROR_TEXT, HINT, INPUT, LABEL, Notice } from './ui'
import OfferCard from '@/components/customer/OfferCard'
import { AlertIcon, CameraIcon, ChevronDownIcon, InfoIcon, TrashIcon } from '@/components/customer/icons'
import { useLocale } from '@/lib/i18n/useLocale'
import { LOCALES } from '@/lib/i18n/locale'
import { DASHBOARD_COPY } from '@/lib/i18n/dashboard'
import { OWNER_UI_COPY, fill } from '@/lib/i18n/ownerUi'
import { campaignErrorCopyFor } from '@/lib/campaignErrors'

export interface CampaignFormBusiness {
  id: string
  name: string
  category: string
  logo_url: string | null
  cover_url: string | null
  ad_credits: number
}

type TranslationKey = 'title_ar' | 'title_en' | 'title_ur' | 'description_ar' | 'description_en' | 'description_ur'
type Translations = Record<TranslationKey, string>
const TRANSLATION_KEYS: TranslationKey[] = ['title_ar', 'title_en', 'title_ur', 'description_ar', 'description_en', 'description_ur']

interface FormState {
  title: string
  description: string
  bid: number
  startDate: string
  endDate: string
  imageUrl: string | null
  translations: Translations
}

function initialState(c: OwnerCampaign | null): FormState {
  return {
    title: c?.title ?? '',
    description: c?.description ?? '',
    bid: c?.bid_per_view ?? 5,
    startDate: c?.start_date ?? '',
    endDate: c?.end_date ?? '',
    imageUrl: c?.image_url ?? null,
    translations: Object.fromEntries(TRANSLATION_KEYS.map((k) => [k, c?.[k] ?? ''])) as Translations,
  }
}

// Existing route: /api/campaigns/upload-image (unchanged) — 5 MB / jpeg-png-webp.
async function uploadCampaignImage(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch('/api/campaigns/upload-image', { method: 'POST', body: formData })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw Object.assign(new Error(body.error || 'upload'), { status: res.status })
  return body.url as string
}

// Full-screen create / edit / duplicate page (no tab bar; sticky action bar
// instead). Same POST /api/campaigns and PATCH /api/campaigns/[id] contracts
// as before — this is a presentation rewrite of the old inline form.
export default function CampaignForm({
  mode,
  business,
  campaign,
  hasOtherActive,
}: {
  mode: 'new' | 'edit' | 'duplicate'
  business: CampaignFormBusiness
  campaign: OwnerCampaign | null
  hasOtherActive: boolean
}) {
  const [locale] = useLocale()
  const copy = OWNER_UI_COPY[locale]
  const f = copy.form
  const campaignsCopy = DASHBOARD_COPY[locale].campaigns
  const ids = useId()

  const [initial] = useState(() => initialState(campaign))
  const [state, setState] = useState<FormState>(initial)
  const [uploading, setUploading] = useState(false)
  const [imageError, setImageError] = useState('')
  const [titleError, setTitleError] = useState(false)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const [translationsOpen, setTranslationsOpen] = useState(() => TRANSLATION_KEYS.some((k) => initial.translations[k]))
  const [keyboardOpen, setKeyboardOpen] = useState(false)
  const leaving = useRef(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setState((s) => ({ ...s, [k]: v }))
  const dirty = mode === 'duplicate' || JSON.stringify(state) !== JSON.stringify(initial)
  const endBeforeStart = Boolean(state.startDate && state.endDate && state.endDate < state.startDate)
  const views = Math.floor(business.ad_credits / state.bid)

  // Unsaved-changes guard for reloads / browser back (every hop in the
  // dashboard is a full navigation, so beforeunload covers them).
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty && !leaving.current) e.preventDefault()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  // Keep the soft keyboard from covering the active field: while it's open
  // (visual viewport noticeably shorter than the layout viewport) the sticky
  // action bar steps out of the way, and the focused field is scrolled into
  // the middle of what's still visible.
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const onResize = () => setKeyboardOpen(vv.height < window.innerHeight * 0.78)
    const onFocus = (e: FocusEvent) => {
      const el = e.target as HTMLElement
      if (el.matches('input:not([type=range]):not([type=file]), textarea')) {
        setTimeout(() => el.scrollIntoView({ block: 'center', behavior: 'smooth' }), 300)
      }
    }
    vv.addEventListener('resize', onResize)
    document.addEventListener('focusin', onFocus)
    return () => {
      vv.removeEventListener('resize', onResize)
      document.removeEventListener('focusin', onFocus)
    }
  }, [])

  function leave() {
    leaving.current = true
    window.location.href = '/dashboard/owner'
  }

  async function handleFile(file: File | undefined) {
    if (!file) return
    setImageError('')
    setUploading(true)
    try {
      const resized = await downscaleImage(file)
      if (resized.size > 5 * 1024 * 1024) throw Object.assign(new Error('big'), { status: 413 })
      set('imageUrl', await uploadCampaignImage(resized))
    } catch (e) {
      const status = (e as { status?: number }).status
      setImageError(
        e instanceof ImageDecodeError
          ? f.imageWrongType
          : status === 413 || /5MB/.test((e as Error).message)
            ? f.imageTooBig
            : status === 400
              ? f.imageWrongType
              : e instanceof TypeError
                ? f.imageNetwork
                : f.imageGeneric,
      )
    } finally {
      setUploading(false)
    }
  }

  function applyPreset(days: number) {
    const start = todayStr()
    setState((s) => ({ ...s, startDate: start, endDate: addDays(start, days) }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!state.title.trim()) {
      setTitleError(true)
      titleRef.current?.focus()
      return
    }
    if (endBeforeStart) return
    setSaving(true)
    const payload = {
      title: state.title,
      description: state.description,
      bid_per_view: state.bid,
      start_date: state.startDate || null,
      end_date: state.endDate || null,
      image_url: state.imageUrl,
      ...state.translations,
    }
    try {
      const res = await fetch(mode === 'edit' && campaign ? `/api/campaigns/${campaign.id}` : '/api/campaigns', {
        method: mode === 'edit' ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setFormError(campaignErrorCopyFor(body.error ?? '', campaignsCopy, mode === 'edit' ? campaignsCopy.toggleError : campaignsCopy.createError))
        setSaving(false)
        return
      }
      leave()
    } catch {
      setFormError(copy.redeem.networkBody)
      setSaving(false)
    }
  }

  const heading = mode === 'edit' ? f.titleEdit : mode === 'duplicate' ? f.titleDuplicate : f.titleNew
  const previewTitle = state.title.trim() || f.titleHint

  return (
    <OwnerShell
      tab={null}
      header={
        <OwnerTopBar
          variant="subpage"
          title={heading}
          backHref="/dashboard/owner"
          backLabel={DASHBOARD_COPY[locale].common.back}
        />
      }
      bottomBar={
        <div
          className={`fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[480px] border-t border-brand-line bg-white px-4 pt-3 sm:border-x ${
            keyboardOpen ? 'hidden' : ''
          }`}
          style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}
        >
          <button type="submit" form={`${ids}-form`} disabled={saving || uploading} className={`${BTN_CORAL} w-full`}>
            {mode === 'edit' ? (saving ? f.saving : f.save) : saving ? f.creating : f.create}
          </button>
        </div>
      }
    >
      <BackInterceptor dirty={dirty} onIntercept={() => setConfirmDiscard(true)} />

      <form id={`${ids}-form`} onSubmit={submit} noValidate className="flex flex-col gap-6">
        {mode !== 'edit' && hasOtherActive && (
          <Notice tone="warning" icon={<AlertIcon size={20} />}>
            {f.activeWarning}
          </Notice>
        )}

        {/* Title + details */}
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor={`${ids}-title`} className={LABEL}>
              {f.titleLabel}
            </label>
            <input
              ref={titleRef}
              id={`${ids}-title`}
              dir="auto"
              value={state.title}
              onChange={(e) => {
                set('title', e.target.value)
                if (e.target.value.trim()) setTitleError(false)
              }}
              placeholder={f.titleHint}
              inputMode="text"
              enterKeyHint="next"
              maxLength={120}
              aria-invalid={titleError}
              aria-describedby={titleError ? `${ids}-title-err` : undefined}
              className={INPUT}
            />
            {titleError && (
              <p id={`${ids}-title-err`} className={ERROR_TEXT}>
                {f.required}
              </p>
            )}
          </div>
          <div>
            <label htmlFor={`${ids}-desc`} className={LABEL}>
              {f.descriptionLabel}
            </label>
            <textarea
              id={`${ids}-desc`}
              dir="auto"
              rows={3}
              value={state.description}
              onChange={(e) => set('description', e.target.value)}
              maxLength={500}
              className={`${INPUT} resize-none`}
            />
          </div>
        </div>

        {/* Image */}
        <div>
          <span className={LABEL}>{f.imageLabel}</span>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => {
              handleFile(e.target.files?.[0])
              e.target.value = ''
            }}
          />
          {state.imageUrl ? (
            <div className="overflow-hidden rounded-[20px] border border-brand-line bg-white">
              <div className="relative aspect-[16/9] bg-brand-tint">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={state.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                {uploading && <UploadingOverlay label={f.imageUploading} />}
              </div>
              <div className="grid grid-cols-2 border-t border-brand-line">
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="flex min-h-12 items-center justify-center gap-2 text-sm font-semibold text-brand-navy active:bg-brand-tint">
                  <CameraIcon size={18} />
                  {f.imageReplace}
                </button>
                <button
                  type="button"
                  onClick={() => set('imageUrl', null)}
                  disabled={uploading}
                  className="flex min-h-12 items-center justify-center gap-2 border-s border-brand-line text-sm font-semibold text-brand-coral active:bg-brand-coral-tint"
                >
                  <TrashIcon size={18} />
                  {f.imageRemove}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="relative flex min-h-36 w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-[20px] border-2 border-dashed border-brand-tint-2 bg-white px-4 py-5 text-brand-navy"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-tint">
                <CameraIcon size={26} />
              </span>
              <span className="text-[15px] font-semibold">{f.imageAdd}</span>
              <span className="max-w-[300px] text-center text-[13px] leading-relaxed text-brand-muted">{f.imageHelp}</span>
              {uploading && <UploadingOverlay label={f.imageUploading} />}
            </button>
          )}
          {imageError && (
            <p role="alert" className={ERROR_TEXT}>
              {imageError}
            </p>
          )}
        </div>

        {/* Price per view */}
        <Card className="p-4">
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor={`${ids}-bid`} className="text-sm font-semibold">
              {f.bidLabel}
            </label>
            <span className="font-display text-[22px] font-bold text-brand-navy">{fill(f.bidValue, { n: state.bid })}</span>
          </div>
          <input
            id={`${ids}-bid`}
            type="range"
            min={2}
            max={10}
            step={1}
            value={state.bid}
            onChange={(e) => set('bid', Number(e.target.value))}
            aria-valuetext={fill(f.bidValue, { n: state.bid })}
            className="mt-2 h-11 w-full cursor-pointer accent-brand-navy"
          />
          <div className="flex justify-between text-xs font-semibold text-brand-muted" aria-hidden="true">
            <span>{f.bidLess}</span>
            <span>{f.bidMore}</span>
          </div>
          <p className={`mt-3 rounded-xl px-3 py-2.5 text-sm font-semibold ${views > 0 ? 'bg-brand-tint text-brand-navy' : 'bg-brand-coral-tint text-brand-coral'}`}>
            {views > 0 ? fill(f.bidEstimate, { n: views.toLocaleString('en'), balance: business.ad_credits.toLocaleString('en') }) : f.bidEstimateNone}
          </p>
          <ul className="mt-3 flex flex-col gap-1.5 text-[13px] leading-relaxed text-brand-muted">
            {[f.bidExplain, f.bidTier, f.bidReach].map((t) => (
              <li key={t} className="flex gap-2">
                <InfoIcon size={15} className="mt-0.5 shrink-0 text-brand-navy" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Dates */}
        <fieldset>
          <legend className={LABEL}>{f.datesLabel}</legend>
          <div className="mb-3 flex flex-wrap gap-2">
            {[
              [f.presetToday, 0],
              [f.presetWeek, 6],
              [f.presetMonth, 29],
            ].map(([label, days]) => (
              <button
                key={label as string}
                type="button"
                onClick={() => applyPreset(days as number)}
                className="min-h-11 rounded-full border-[1.5px] border-brand-tint-2 bg-white px-4 text-sm font-semibold text-brand-navy active:bg-brand-tint"
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <DateField label={f.start} value={state.startDate} onChange={(d) => set('startDate', d)} placeholder={f.noStart} locale={locale} />
            <DateField
              label={f.end}
              value={state.endDate}
              onChange={(d) => set('endDate', d)}
              min={state.startDate || undefined}
              placeholder={f.noEnd}
              locale={locale}
              invalid={endBeforeStart}
              describedBy={endBeforeStart ? `${ids}-date-err` : undefined}
            />
          </div>
          <p className={HINT}>{f.datesHint}</p>
          {endBeforeStart && (
            <p id={`${ids}-date-err`} role="alert" className={ERROR_TEXT}>
              {f.endError}
            </p>
          )}
        </fieldset>

        {/* Live preview — the real customer OfferCard, inert */}
        <section aria-label={f.previewHeading}>
          <h2 className={LABEL}>{f.previewHeading}</h2>
          <p className={`${HINT} -mt-1 mb-2`}>{f.previewNote}</p>
          <div inert className="pointer-events-none select-none">
            <OfferCard
              variant="featured"
              locale={locale}
              offer={{
                id: 'preview',
                href: '#',
                title: previewTitle,
                businessName: business.name,
                businessLogoUrl: business.logo_url,
                category: business.category,
                distanceKm: null,
                imageUrl: state.imageUrl ?? business.cover_url,
                endDate: state.endDate || null,
              }}
            />
          </div>
        </section>

        {/* Translations */}
        <Card className="overflow-hidden">
          <button
            type="button"
            onClick={() => setTranslationsOpen((v) => !v)}
            aria-expanded={translationsOpen}
            aria-controls={`${ids}-tr`}
            className="flex min-h-14 w-full items-center gap-3 px-4 text-start"
          >
            <span className="flex-1 text-[15px] font-semibold">{f.translationsHeading}</span>
            <ChevronDownIcon size={20} className={`text-brand-muted transition-transform ${translationsOpen ? 'rotate-180' : ''}`} />
          </button>
          {translationsOpen && (
            <div id={`${ids}-tr`} className="flex flex-col gap-5 border-t border-brand-line p-4">
              <p className="text-[13px] leading-relaxed text-brand-muted">{f.translationsHint}</p>
              {LOCALES.map((l) => (
                <div key={l.code} lang={l.code} className="flex flex-col gap-2">
                  <span className="text-sm font-semibold">{l.label}</span>
                  <input
                    dir={l.code === 'en' ? 'ltr' : 'rtl'}
                    aria-label={`${f.titleLabel} — ${l.label}`}
                    placeholder={f.titleLabel}
                    value={state.translations[`title_${l.code}`]}
                    onChange={(e) => set('translations', { ...state.translations, [`title_${l.code}`]: e.target.value })}
                    className={INPUT}
                  />
                  <textarea
                    dir={l.code === 'en' ? 'ltr' : 'rtl'}
                    aria-label={`${f.descriptionLabel} — ${l.label}`}
                    placeholder={f.descriptionLabel}
                    rows={2}
                    value={state.translations[`description_${l.code}`]}
                    onChange={(e) => set('translations', { ...state.translations, [`description_${l.code}`]: e.target.value })}
                    className={`${INPUT} resize-none`}
                  />
                </div>
              ))}
            </div>
          )}
        </Card>

        {formError && (
          <Notice tone="warning" icon={<AlertIcon size={20} />}>
            {formError}
          </Notice>
        )}
      </form>

      <Sheet
        open={confirmDiscard}
        onClose={() => setConfirmDiscard(false)}
        title={f.discardTitle}
        footer={
          <div className="grid grid-cols-2 gap-2.5">
            <button type="button" onClick={() => setConfirmDiscard(false)} className={BTN_SECONDARY}>
              {f.keepEditing}
            </button>
            <button type="button" onClick={leave} className={`${BTN_PRIMARY} !bg-brand-coral`}>
              {f.discard}
            </button>
          </div>
        }
      >
        <p className="text-[15px] text-brand-muted">{f.discardBody}</p>
      </Sheet>
    </OwnerShell>
  )
}

function UploadingOverlay({ label }: { label: string }) {
  return (
    <span role="status" className="absolute inset-0 flex items-center justify-center gap-2 bg-white/85 text-sm font-semibold text-brand-navy">
      <span aria-hidden="true" className="h-5 w-5 animate-spin rounded-full border-2 border-brand-tint-2 border-t-brand-navy motion-reduce:animate-none" />
      {label}
    </span>
  )
}

// The top bar's back link is a plain <a href="/dashboard/owner">; while the
// form is dirty, catch that click and ask first instead of leaving.
function BackInterceptor({ dirty, onIntercept }: { dirty: boolean; onIntercept: () => void }) {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest('header a[href="/dashboard/owner"]')
      if (a && dirty) {
        e.preventDefault()
        onIntercept()
      }
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [dirty, onIntercept])
  return null
}
