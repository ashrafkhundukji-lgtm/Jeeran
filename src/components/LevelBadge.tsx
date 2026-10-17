import type { PromotionLevel } from '@/lib/promotion'
import type { Locale } from '@/lib/i18n/locale'

const STYLES: Record<PromotionLevel, string> = {
  bronze: 'bg-orange-50 text-orange-800',
  silver: 'bg-neutral-100 text-neutral-600',
  gold: 'bg-yellow-50 text-yellow-700',
  platinum: 'bg-indigo-50 text-indigo-700',
}

// Not part of DASHBOARD_COPY/BROWSE_COPY — this badge is shared across
// dashboard, browse, and admin views, so it carries its own locale table
// rather than depending on any one feature's copy file. `locale` defaults to
// 'en' so the admin views (AdminSpreadMap, AdminShopsList), which have no
// i18n wiring at all, keep working unchanged.
export const LEVEL_LABELS: Record<Locale, Record<PromotionLevel, string>> = {
  en: { bronze: 'Bronze', silver: 'Silver', gold: 'Gold', platinum: 'Platinum' },
  ar: { bronze: 'برونزي', silver: 'فضي', gold: 'ذهبي', platinum: 'بلاتيني' },
  ur: { bronze: 'کانسی', silver: 'چاندی', gold: 'سونا', platinum: 'پلاٹینم' },
}

const MEDALS: Record<PromotionLevel, string> = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '💎',
}

export default function LevelBadge({
  level,
  variant = 'pill',
  locale = 'en',
}: {
  level: PromotionLevel
  variant?: 'pill' | 'medal' | 'chip'
  locale?: Locale
}) {
  const label = LEVEL_LABELS[locale][level]

  if (variant === 'medal') {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-700">
        <span className="text-xl leading-none">{MEDALS[level]}</span>
        {label}
      </span>
    )
  }

  // Mobile redesign's tier indicator (design_handoff_jeeran_mobile/README.md,
  // owner-home §1) — a flat tint/ink pair, same regardless of tier (unlike
  // `pill`'s per-tier STYLES), replacing `medal`'s emoji there since emoji
  // render inconsistently across platforms and can't be brand-colored. A new
  // variant rather than changing `medal` in place, since admin views
  // (AdminShopsList) still use `medal`.
  if (variant === 'chip') {
    // Restyled to the navy/coral system for the owner dashboard refresh —
    // one flat tint/navy pair for every tier (tier is told apart by its
    // label, not a fourth color).
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-brand-tint px-2.5 py-1 text-[13px] font-semibold text-brand-navy">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="9" r="5.5" />
          <path d="m8.5 13.5-1.5 7 5-2.5 5 2.5-1.5-7" />
        </svg>
        {label}
      </span>
    )
  }

  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STYLES[level]}`}>{label}</span>
  )
}
