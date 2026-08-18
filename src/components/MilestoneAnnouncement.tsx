'use client'

import { useState } from 'react'
import { useLocale } from '@/lib/i18n/useLocale'
import { getDir } from '@/lib/i18n/locale'
import { DASHBOARD_COPY } from '@/lib/i18n/dashboard'
import type { PromotionLevel } from '@/lib/promotion'

// Same medal/label maps as LevelBadge — not imported from there since
// LevelBadge only exports the component, not the maps themselves.
const LABELS: Record<'en' | 'ar' | 'ur', Record<PromotionLevel, string>> = {
  en: { bronze: 'Bronze', silver: 'Silver', gold: 'Gold', platinum: 'Platinum' },
  ar: { bronze: 'برونزي', silver: 'فضي', gold: 'ذهبي', platinum: 'بلاتيني' },
  ur: { bronze: 'کانسی', silver: 'چاندی', gold: 'سونا', platinum: 'پلاٹینم' },
}
const MEDALS: Record<PromotionLevel, string> = { bronze: '🥉', silver: '🥈', gold: '🥇', platinum: '💎' }

// Phase 4, item 9 — a real acknowledged moment, not a passive ad_credits
// number quietly being higher than before. Shown once per crossing (the
// unseen_milestone_tier/unseen_milestone_bonus pair on `businesses` is set
// by check_and_award_milestone_bonus() at the moment of the crossing, and
// cleared here on dismiss via /api/dashboard/dismiss-milestone — same
// "real moment, not silent" spirit as AddToWalletMembershipButton's
// first-scan confirmation from item 12).
export default function MilestoneAnnouncement({
  tier,
  bonus,
}: {
  tier: PromotionLevel
  bonus: number
}) {
  const [locale] = useLocale()
  const dir = getDir(locale)
  const copy = DASHBOARD_COPY[locale].milestone
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  async function handleDismiss() {
    setDismissed(true) // optimistic — no reason to make the owner wait on this
    try {
      await fetch('/api/dashboard/dismiss-milestone', { method: 'POST' })
    } catch {
      // Worst case it shows again on next load — not worth surfacing an
      // error for a dismiss-tracking request.
    }
  }

  return (
    <div
      dir={dir}
      className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-center justify-between gap-4"
    >
      <p className="text-sm font-medium text-amber-900">
        <span className="text-xl align-middle me-1.5">{MEDALS[tier]}</span>
        {copy.reached.replace('{tier}', LABELS[locale][tier]).replace('{n}', String(bonus))}
      </p>
      <button
        type="button"
        onClick={handleDismiss}
        className="shrink-0 bg-white border border-amber-300 text-amber-800 text-xs font-medium rounded-lg px-3 py-1.5 transition-colors hover:bg-amber-100"
      >
        {copy.dismiss}
      </button>
    </div>
  )
}
