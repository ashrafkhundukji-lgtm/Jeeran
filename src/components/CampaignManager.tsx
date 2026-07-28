'use client'

import { useState } from 'react'
import { useLocale } from '@/lib/i18n/useLocale'
import { DASHBOARD_COPY, type DashboardCopy } from '@/lib/i18n/dashboard'

interface Campaign {
  id: string
  title: string
  description: string | null
  bid_per_view: number
  is_active: boolean
  start_date: string | null
  end_date: string | null
}

function formatDate(date: string) {
  return new Date(date + 'T00:00:00').toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
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
}) {
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
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toggleError, setToggleError] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editBid, setEditBid] = useState(5)
  const [editStartDate, setEditStartDate] = useState('')
  const [editEndDate, setEditEndDate] = useState('')
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
      }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error || copy.createError)
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
      setToggleError(body.error || copy.toggleError)
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
      }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setEditError(body.error || copy.toggleError)
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
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={saving}
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
              />
              {editError && <p className="text-sm text-red-600">{editError}</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={editSaving}
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
              <div>
                <div className="font-medium text-sm">{c.title}</div>
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
