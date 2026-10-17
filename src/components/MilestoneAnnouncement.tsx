'use client'

import { useState } from 'react'
import { useLocale } from '@/lib/i18n/useLocale'
import { getDir } from '@/lib/i18n/locale'
import { DASHBOARD_COPY } from '@/lib/i18n/dashboard'
import type { PromotionLevel } from '@/lib/promotion'
import { LEVEL_LABELS } from '@/components/LevelBadge'
import { AwardIcon } from '@/components/customer/icons'

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
    <div dir={dir} role="status" className="flex items-center gap-3 rounded-[22px] bg-brand-tint p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-navy text-white">
        <AwardIcon size={22} />
      </span>
      <p className="min-w-0 flex-1 text-[15px] leading-relaxed font-semibold text-brand-navy-deep">
        {copy.reached.replace('{tier}', LEVEL_LABELS[locale][tier]).replace('{n}', String(bonus))}
      </p>
      <button
        type="button"
        onClick={handleDismiss}
        className="min-h-11 shrink-0 rounded-xl px-3 text-sm font-semibold text-brand-navy active:bg-white"
      >
        {copy.dismiss}
      </button>
    </div>
  )
}
