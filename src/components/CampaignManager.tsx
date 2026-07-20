'use client'

import { useState } from 'react'

interface Campaign {
  id: string
  title: string
  description: string | null
  bid_per_view: number
  is_active: boolean
}

export default function CampaignManager({ initialCampaigns }: { initialCampaigns: Campaign[] }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [bid, setBid] = useState(5)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toggleError, setToggleError] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const res = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, bid_per_view: bid }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error || 'Could not create campaign')
      setSaving(false)
      return
    }

    const { campaign } = await res.json()
    setCampaigns((prev) => [campaign, ...prev])
    setTitle('')
    setDescription('')
    setBid(5)
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
      setToggleError(body.error || 'Could not update campaign')
      return
    }
    setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, is_active: !current } : c)))
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Campaigns</h2>
        <button onClick={() => setShowForm((s) => !s)} className="text-sm font-medium underline">
          {showForm ? 'Cancel' : '+ New campaign'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="border border-neutral-200 rounded-xl p-4 mb-4 flex flex-col gap-3"
        >
          <input
            required
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border border-neutral-300 rounded-lg px-3 py-2 text-sm"
          />
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border border-neutral-300 rounded-lg px-3 py-2 text-sm"
            rows={2}
          />
          <div>
            <label className="text-xs text-neutral-500 font-medium block mb-1">
              Bid per view: {bid} credits
            </label>
            <input
              type="range"
              min={2}
              max={10}
              value={bid}
              onChange={(e) => setBid(Number(e.target.value))}
              className="w-full"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="bg-black text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50"
          >
            {saving ? 'Creating…' : 'Create campaign'}
          </button>
        </form>
      )}

      {toggleError && <p className="text-sm text-red-600 mb-2">{toggleError}</p>}

      <div className="flex flex-col gap-2">
        {campaigns.length === 0 && <p className="text-sm text-neutral-400">No campaigns yet.</p>}
        {campaigns.map((c) => (
          <div
            key={c.id}
            className="border border-neutral-200 rounded-lg p-3 flex items-center justify-between"
          >
            <div>
              <div className="font-medium text-sm">{c.title}</div>
              <div className="text-xs text-neutral-500">{c.bid_per_view} credits/view</div>
            </div>
            <button
              onClick={() => toggleActive(c.id, c.is_active)}
              className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                c.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-500'
              }`}
            >
              {c.is_active ? 'Active' : 'Inactive'}
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
