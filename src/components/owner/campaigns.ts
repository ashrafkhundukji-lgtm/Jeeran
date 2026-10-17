'use client'

import { useState } from 'react'
import { campaignErrorCopyFor } from '@/lib/campaignErrors'
import type { DashboardCopy } from '@/lib/i18n/dashboard'
import type { Locale } from '@/lib/i18n/locale'
import { INTL_LOCALE } from '@/lib/i18n/ownerUi'

export interface OwnerCampaign {
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

// One source of truth for the active flag across the active-offer card and
// the offers list (previously each kept its own copy, so the two could
// disagree after a toggle). Optimistic: flips immediately, rolls back and
// surfaces the API's mapped error if PATCH fails (e.g. the one-active cap).
export function useCampaigns(initial: OwnerCampaign[], copy: DashboardCopy['campaigns']) {
  const [campaigns, setCampaigns] = useState(initial)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function setActive(id: string, next: boolean) {
    setError('')
    setPendingId(id)
    setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, is_active: next } : c)))
    try {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: next }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(campaignErrorCopyFor(body.error ?? '', copy, copy.toggleError))
      }
    } catch (e) {
      setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, is_active: !next } : c)))
      setError(e instanceof Error && e.message ? e.message : copy.toggleError)
    } finally {
      setPendingId(null)
    }
  }

  return { campaigns, setActive, pendingId, error }
}

// 'YYYY-MM-DD' (a DATE column, no time zone) → short local date in the page
// language, Gregorian, Latin digits.
export function formatDay(day: string, locale: Locale, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }): string {
  const [y, m, d] = day.split('-').map(Number)
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], { ...opts, timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, d)))
}
