import type { PromotionLevel } from '@/lib/promotion'

const STYLES: Record<PromotionLevel, string> = {
  bronze: 'bg-orange-50 text-orange-800',
  silver: 'bg-neutral-100 text-neutral-600',
  gold: 'bg-yellow-50 text-yellow-700',
  platinum: 'bg-indigo-50 text-indigo-700',
}

const LABELS: Record<PromotionLevel, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
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
}: {
  level: PromotionLevel
  variant?: 'pill' | 'medal'
}) {
  if (variant === 'medal') {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-700">
        <span className="text-xl leading-none">{MEDALS[level]}</span>
        {LABELS[level]}
      </span>
    )
  }

  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STYLES[level]}`}>{LABELS[level]}</span>
  )
}
