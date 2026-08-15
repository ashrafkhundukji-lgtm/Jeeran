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
const LABELS: Record<Locale, Record<PromotionLevel, string>> = {
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
  variant?: 'pill' | 'medal'
  locale?: Locale
}) {
  const label = LABELS[locale][level]

  if (variant === 'medal') {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-700">
        <span className="text-xl leading-none">{MEDALS[level]}</span>
        {label}
      </span>
    )
  }

  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STYLES[level]}`}>{label}</span>
  )
}
