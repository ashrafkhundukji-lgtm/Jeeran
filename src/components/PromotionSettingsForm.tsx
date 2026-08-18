'use client'

import { useState } from 'react'
import type { PromotionThresholds } from '@/lib/promotion'

export default function PromotionSettingsForm({ initialThresholds }: { initialThresholds: PromotionThresholds }) {
  const [silverThreshold, setSilverThreshold] = useState(initialThresholds.silverThreshold)
  const [goldThreshold, setGoldThreshold] = useState(initialThresholds.goldThreshold)
  const [platinumThreshold, setPlatinumThreshold] = useState(initialThresholds.platinumThreshold)
  const [bidTiebreakRange, setBidTiebreakRange] = useState(initialThresholds.bidTiebreakRange)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSaved(false)

    const res = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ silverThreshold, goldThreshold, platinumThreshold, bidTiebreakRange }),
    })
    const body = await res.json().catch(() => ({}))

    if (!res.ok) {
      setError(body.error || 'Could not save settings')
      setSaving(false)
      return
    }

    setSaved(true)
    setSaving(false)
  }

  const inputClass = 'w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm'
  const labelClass = 'text-xs text-[#5a5a5a] font-medium block mb-1'

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className={labelClass}>Silver threshold (redemptions)</label>
        <input
          type="number"
          min={1}
          required
          className={inputClass}
          value={silverThreshold}
          onChange={(e) => setSilverThreshold(Number(e.target.value))}
        />
      </div>
      <div>
        <label className={labelClass}>Gold threshold (redemptions)</label>
        <input
          type="number"
          min={1}
          required
          className={inputClass}
          value={goldThreshold}
          onChange={(e) => setGoldThreshold(Number(e.target.value))}
        />
      </div>
      <div>
        <label className={labelClass}>Platinum threshold (redemptions)</label>
        <input
          type="number"
          min={1}
          required
          className={inputClass}
          value={platinumThreshold}
          onChange={(e) => setPlatinumThreshold(Number(e.target.value))}
        />
      </div>
      <div>
        <label className={labelClass}>Bid tiebreak range (credits)</label>
        <input
          type="number"
          min={1}
          required
          className={inputClass}
          value={bidTiebreakRange}
          onChange={(e) => setBidTiebreakRange(Number(e.target.value))}
        />
        <p className="text-xs text-neutral-400 mt-1">
          Bids within this many credits of each other are treated as a contested slot — tier
          decides who ranks first among them, instead of bid alone.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-emerald-600">Saved.</p>}

      <button
        type="submit"
        disabled={saving}
        className="bg-[#FF6B4A] text-white rounded-lg py-2.5 text-sm font-medium transition-colors hover:bg-[#e85a3b] disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  )
}
