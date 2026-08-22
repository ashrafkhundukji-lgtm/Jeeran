'use client'

import { useState } from 'react'
import { useLocale } from '@/lib/i18n/useLocale'
import { DASHBOARD_COPY, type DashboardCopy } from '@/lib/i18n/dashboard'
import { LOCALES } from '@/lib/i18n/locale'

interface Campaign {
  id: string
  title: string
  description: string | null
  bid_per_view: number
  is_active: boolean
  start_date: string | null
  end_date: string | null
  image_url: string | null
  title_ar: string | null
  title_en: string | null
  title_ur: string | null
  description_ar: string | null
  description_en: string | null
  description_ur: string | null
}

// Optional shop-provided per-locale overrides — see
// supabase/migrations/20260822b_campaign_translations.sql. Bundled into one
// object (rather than 12 more individual useState/props on top of the
// already-long list below) since every field in here is always read/written
// together as a unit.
interface CampaignTranslationFields {
  title_ar: string
  title_en: string
  title_ur: string
  description_ar: string
  description_en: string
  description_ur: string
}

const EMPTY_TRANSLATIONS: CampaignTranslationFields = {
  title_ar: '',
  title_en: '',
  title_ur: '',
  description_ar: '',
  description_en: '',
  description_ur: '',
}

function translationsFromCampaign(c: Campaign): CampaignTranslationFields {
  return {
    title_ar: c.title_ar ?? '',
    title_en: c.title_en ?? '',
    title_ur: c.title_ur ?? '',
    description_ar: c.description_ar ?? '',
    description_en: c.description_en ?? '',
    description_ur: c.description_ur ?? '',
  }
}

// Shared by the create and edit forms — uploads immediately on file select
// (rather than deferring to form submit) so the preview and any upload
// error show up right away, and the create/edit payload just carries
// whatever URL this already resolved to.
async function uploadCampaignImage(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch('/api/campaigns/upload-image', { method: 'POST', body: formData })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error || 'Could not upload image')
  return body.url as string
}

function formatDate(date: string) {
  return new Date(date + 'T00:00:00').toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// Maps /api/campaigns and /api/campaigns/[id]'s own known error strings to
// localized copy — those routes return raw English text, so showing
// `body.error` directly (the previous behavior) meant every specific error
// stayed English regardless of the dashboard's selected language, even
// though the fallback generic message was already translated. Anything not
// in this list (an unexpected 500, a raw Postgres error) falls back to the
// given translated generic message instead of leaking raw English text.
function campaignErrorCopyFor(rawError: string, copy: DashboardCopy['campaigns'], fallback: string): string {
  switch (rawError) {
    case 'Not authenticated':
      return copy.errorNotAuthenticated
    case 'This account is frozen':
      return copy.errorFrozen
    case 'No business found for this account':
      return copy.errorNoBusiness
    case 'Title is required':
      return copy.errorTitleRequired
    case 'bid_per_view must be between 2 and 10':
      return copy.errorBidRange
    case 'End date must be on or after the start date':
      return copy.endDateError
    case 'You already have an active campaign — deactivate it before creating another.':
      return copy.errorAlreadyActiveCreate
    case 'You already have another active campaign — deactivate it first.':
      return copy.errorAlreadyActiveToggle
    case 'Campaign not found':
      return copy.errorCampaignNotFound
    default:
      return fallback
  }
}

function CampaignFields({
  copy,
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  bid,
  onBidChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  imageUrl,
  onImageChange,
  imageUploading,
  onImageUploadingChange,
  imageError,
  onImageErrorChange,
  translations,
  onTranslationsChange,
}: {
  copy: DashboardCopy['campaigns']
  title: string
  onTitleChange: (v: string) => void
  description: string
  onDescriptionChange: (v: string) => void
  bid: number
  onBidChange: (v: number) => void
  startDate: string
  onStartDateChange: (v: string) => void
  endDate: string
  onEndDateChange: (v: string) => void
  imageUrl: string | null
  onImageChange: (url: string | null) => void
  imageUploading: boolean
  onImageUploadingChange: (v: boolean) => void
  imageError: string
  translations: CampaignTranslationFields
  onTranslationsChange: (next: CampaignTranslationFields) => void
  onImageErrorChange: (v: string) => void
}) {
  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file after a removal
    if (!file) return
    onImageErrorChange('')
    onImageUploadingChange(true)
    try {
      const url = await uploadCampaignImage(file)
      onImageChange(url)
    } catch (err) {
      onImageErrorChange(err instanceof Error ? err.message : copy.imageError)
    } finally {
      onImageUploadingChange(false)
    }
  }

  // Collapsed by default — most shops will skip this entirely (the offer
  // page already falls back to an auto-translated version with zero effort
  // on their part; see src/lib/translate.ts), so it stays out of the way of
  // the common create/edit flow rather than adding 6 more always-visible
  // fields to an already-long form. Local to this component instance (not
  // lifted to CampaignManager state) since it's pure UI disclosure state,
  // not data — the create form and each campaign's edit form each get their
  // own independent open/closed state, which is the expected behavior.
  const [translationsOpen, setTranslationsOpen] = useState(false)

  return (
    <>
      <input
        required
        placeholder={copy.titlePlaceholder}
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        className="border border-neutral-300 rounded-lg px-3 py-2 text-sm"
      />
      <textarea
        placeholder={copy.descriptionPlaceholder}
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        className="border border-neutral-300 rounded-lg px-3 py-2 text-sm"
        rows={2}
      />
      <div>
        <label className="text-xs text-neutral-500 font-medium block mb-1">{copy.imageLabel}</label>
        {imageUrl ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="" className="w-16 h-16 rounded-lg object-cover border border-neutral-200" />
            <button
              type="button"
              onClick={() => onImageChange(null)}
              className="text-xs font-medium text-neutral-500 hover:text-red-600 transition-colors"
            >
              {copy.imageRemove}
            </button>
          </div>
        ) : (
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            disabled={imageUploading}
            className="text-sm"
          />
        )}
        {imageUploading && <p className="text-xs text-neutral-400 mt-1">{copy.imageUploading}</p>}
        {imageError && <p className="text-xs text-red-600 mt-1">{imageError}</p>}
      </div>
      <div>
        <label className="text-xs text-neutral-500 font-medium block mb-1">
          {copy.bidPerView.replace('{n}', String(bid))}
        </label>
        <input
          type="range"
          min={2}
          max={10}
          value={bid}
          onChange={(e) => onBidChange(Number(e.target.value))}
          className="w-full"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-neutral-500 font-medium block mb-1">{copy.startDate}</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-neutral-500 font-medium block mb-1">{copy.endDate}</label>
          <input
            type="date"
            min={startDate || undefined}
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={() => setTranslationsOpen((v) => !v)}
          className="text-xs font-medium text-neutral-500 underline"
        >
          {translationsOpen ? copy.translationsHide : copy.translationsShow}
        </button>
        {translationsOpen && (
          <div className="mt-2 flex flex-col gap-3 rounded-lg border border-neutral-200 p-3">
            <p className="text-xs text-neutral-400">{copy.translationsHint}</p>
            {LOCALES.map((l) => (
              <div key={l.code}>
                <label className="text-xs text-neutral-500 font-medium block mb-1">{l.label}</label>
                <input
                  placeholder={copy.titlePlaceholder}
                  value={translations[`title_${l.code}`]}
                  onChange={(e) => onTranslationsChange({ ...translations, [`title_${l.code}`]: e.target.value })}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm mb-1.5"
                />
                <textarea
                  placeholder={copy.descriptionPlaceholder}
                  value={translations[`description_${l.code}`]}
                  onChange={(e) =>
                    onTranslationsChange({ ...translations, [`description_${l.code}`]: e.target.value })
                  }
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm"
                  rows={2}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function ActiveToggle({
  active,
  onToggle,
  copy,
}: {
  active: boolean
  onToggle: () => void
  copy: DashboardCopy['campaigns']
}) {
  return (
    <button type="button" onClick={onToggle} aria-pressed={active} className="flex items-center gap-2">
      <span className={`text-xs font-medium ${active ? 'text-emerald-700' : 'text-neutral-500'}`}>
        {active ? copy.active : copy.inactive}
      </span>
      <span
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
          active ? 'bg-emerald-500' : 'bg-neutral-300'
        }`}
      >
        <span
          className="inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform"
          style={{ transform: active ? 'translateX(18px)' : 'translateX(2px)' }}
        />
      </span>
    </button>
  )
}

export default function CampaignManager({ initialCampaigns }: { initialCampaigns: Campaign[] }) {
  const [locale] = useLocale()
  const copy = DASHBOARD_COPY[locale].campaigns

  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [bid, setBid] = useState(5)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageUploading, setImageUploading] = useState(false)
  const [imageError, setImageError] = useState('')
  const [translations, setTranslations] = useState<CampaignTranslationFields>(EMPTY_TRANSLATIONS)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toggleError, setToggleError] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editBid, setEditBid] = useState(5)
  const [editStartDate, setEditStartDate] = useState('')
  const [editEndDate, setEditEndDate] = useState('')
  const [editImageUrl, setEditImageUrl] = useState<string | null>(null)
  const [editImageUploading, setEditImageUploading] = useState(false)
  const [editImageError, setEditImageError] = useState('')
  const [editTranslations, setEditTranslations] = useState<CampaignTranslationFields>(EMPTY_TRANSLATIONS)
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    if (startDate && endDate && endDate < startDate) {
      setError(copy.endDateError)
      setSaving(false)
      return
    }

    const res = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        bid_per_view: bid,
        start_date: startDate || null,
        end_date: endDate || null,
        image_url: imageUrl,
        ...translations,
      }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(campaignErrorCopyFor(body.error ?? '', copy, copy.createError))
      setSaving(false)
      return
    }

    const { campaign } = await res.json()
    setCampaigns((prev) => [campaign, ...prev])
    setTitle('')
    setDescription('')
    setBid(5)
    setStartDate('')
    setEndDate('')
    setImageUrl(null)
    setImageError('')
    setTranslations(EMPTY_TRANSLATIONS)
    setShowForm(false)
    setSaving(false)
  }

  async function toggleActive(id: string, current: boolean) {
    setToggleError('')
    // Only flip local state after the server confirms — an optimistic
    // flip here would lie about the result on a 409 (e.g. the one-active-
    // campaign cap) or an RLS-rejected update.
    const res = await fetch(`/api/campaigns/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !current }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setToggleError(campaignErrorCopyFor(body.error ?? '', copy, copy.toggleError))
      return
    }
    setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, is_active: !current } : c)))
  }

  function openEdit(c: Campaign) {
    setEditingId(c.id)
    setEditTitle(c.title)
    setEditDescription(c.description ?? '')
    setEditBid(c.bid_per_view)
    setEditStartDate(c.start_date ?? '')
    setEditEndDate(c.end_date ?? '')
    setEditImageUrl(c.image_url)
    setEditImageError('')
    setEditTranslations(translationsFromCampaign(c))
    setEditError('')
  }

  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault()
    if (!editingId) return
    setEditSaving(true)
    setEditError('')

    if (editStartDate && editEndDate && editEndDate < editStartDate) {
      setEditError(copy.endDateError)
      setEditSaving(false)
      return
    }

    const res = await fetch(`/api/campaigns/${editingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: editTitle,
        description: editDescription,
        bid_per_view: editBid,
        start_date: editStartDate || null,
        end_date: editEndDate || null,
        image_url: editImageUrl,
        ...editTranslations,
      }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setEditError(campaignErrorCopyFor(body.error ?? '', copy, copy.toggleError))
      setEditSaving(false)
      return
    }

    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === editingId
          ? {
              ...c,
              title: editTitle,
              description: editDescription || null,
              bid_per_view: editBid,
              start_date: editStartDate || null,
              end_date: editEndDate || null,
              image_url: editImageUrl,
              title_ar: editTranslations.title_ar || null,
              title_en: editTranslations.title_en || null,
              title_ur: editTranslations.title_ur || null,
              description_ar: editTranslations.description_ar || null,
              description_en: editTranslations.description_en || null,
              description_ur: editTranslations.description_ur || null,
            }
          : c,
      ),
    )
    setEditSaving(false)
    setEditingId(null)
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">{copy.heading}</h2>
        <button onClick={() => setShowForm((s) => !s)} className="text-sm font-medium underline">
          {showForm ? copy.cancel : copy.newCampaign}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="border border-neutral-200 rounded-xl p-4 mb-4 flex flex-col gap-3"
        >
          <CampaignFields
            copy={copy}
            title={title}
            onTitleChange={setTitle}
            description={description}
            onDescriptionChange={setDescription}
            bid={bid}
            onBidChange={setBid}
            startDate={startDate}
            onStartDateChange={setStartDate}
            endDate={endDate}
            onEndDateChange={setEndDate}
            imageUrl={imageUrl}
            onImageChange={setImageUrl}
            imageUploading={imageUploading}
            onImageUploadingChange={setImageUploading}
            imageError={imageError}
            onImageErrorChange={setImageError}
            translations={translations}
            onTranslationsChange={setTranslations}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={saving || imageUploading}
            className="bg-[#FF6B4A] text-white rounded-lg py-2 text-sm font-medium transition-colors hover:bg-[#e85a3b] disabled:opacity-50"
          >
            {saving ? copy.creatingButton : copy.createButton}
          </button>
        </form>
      )}

      {toggleError && <p className="text-sm text-red-600 mb-2">{toggleError}</p>}

      <div className="flex flex-col gap-2">
        {campaigns.length === 0 && <p className="text-sm text-neutral-400">{copy.noCampaigns}</p>}
        {campaigns.map((c) =>
          editingId === c.id ? (
            <form
              key={c.id}
              onSubmit={handleEditSave}
              className="border border-neutral-200 rounded-xl p-4 flex flex-col gap-3"
            >
              <CampaignFields
                copy={copy}
                title={editTitle}
                onTitleChange={setEditTitle}
                description={editDescription}
                onDescriptionChange={setEditDescription}
                bid={editBid}
                onBidChange={setEditBid}
                startDate={editStartDate}
                onStartDateChange={setEditStartDate}
                endDate={editEndDate}
                onEndDateChange={setEditEndDate}
                imageUrl={editImageUrl}
                onImageChange={setEditImageUrl}
                imageUploading={editImageUploading}
                onImageUploadingChange={setEditImageUploading}
                imageError={editImageError}
                onImageErrorChange={setEditImageError}
                translations={editTranslations}
                onTranslationsChange={setEditTranslations}
              />
              {editError && <p className="text-sm text-red-600">{editError}</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={editSaving || editImageUploading}
                  className="flex-1 bg-[#FF6B4A] text-white rounded-lg py-2 text-sm font-medium transition-colors hover:bg-[#e85a3b] disabled:opacity-50"
                >
                  {editSaving ? copy.savingChanges : copy.saveChanges}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="px-4 text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
                >
                  {copy.cancel}
                </button>
              </div>
            </form>
          ) : (
            <div key={c.id} className="border border-neutral-200 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                {c.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.image_url} alt="" className="w-10 h-10 rounded-lg object-cover border border-neutral-200 shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{c.title}</div>
                  <div className="text-xs text-neutral-500">
                    {copy.creditsPerView.replace('{n}', String(c.bid_per_view))}
                    {(c.start_date || c.end_date) && (
                      <>
                        {' · '}
                        {c.start_date ? formatDate(c.start_date) : copy.noStartDate}
                        {' – '}
                        {c.end_date ? formatDate(c.end_date) : copy.noEndDate}
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => openEdit(c)}
                  className="text-xs font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
                >
                  {copy.edit}
                </button>
                <ActiveToggle active={c.is_active} onToggle={() => toggleActive(c.id, c.is_active)} copy={copy} />
              </div>
            </div>
          ),
        )}
      </div>
    </section>
  )
}
