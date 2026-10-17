import type { ReactNode } from 'react'
import type { Locale } from '@/lib/i18n/locale'
import { CUSTOMER_UI_COPY } from '@/lib/i18n/customerUi'
import { badgeText, daysUntilEnd, deriveBadge, formatDistance } from '@/lib/display'
import { CategoryIcon, ClockIcon, PinIcon } from './icons'

// Press feedback for every tappable card/button in the customer UI —
// motion-reduce users get no scale.
export const PRESS = 'transition-transform duration-150 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100'

// Coral pill with the derived discount ("20%", "1+1", "Free"). Renders
// nothing unless deriveBadge() is confident. The value sits in a
// <bdi dir="ltr"> so "1+1" / "20%" never reorder in RTL.
export function DiscountBadge({
  title,
  locale,
  size = 'sm',
  className = '',
}: {
  title: string
  locale: Locale
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const badge = deriveBadge(title)
  if (!badge) return null
  const sizes = { sm: 'px-2 py-0.5 text-xs', md: 'px-3.5 py-1 text-[15px]', lg: 'px-[18px] py-1.5 text-[22px]' }
  return (
    <span className={`inline-block rounded-full bg-brand-coral font-display font-bold leading-snug text-white ${sizes[size]} ${className}`}>
      <bdi dir="ltr">{badgeText(badge, CUSTOMER_UI_COPY[locale].free)}</bdi>
    </span>
  )
}

// "Ends today" / "Ends in N days" — nothing beyond 3 days or with no end
// date. `tone="overlay"` is the white pill used on top of a cover image.
export function ExpiryChip({
  endDate,
  locale,
  tone = 'auto',
  className = '',
}: {
  endDate: string | null | undefined
  locale: Locale
  tone?: 'auto' | 'overlay'
  className?: string
}) {
  const days = daysUntilEnd(endDate)
  if (days == null) return null
  const copy = CUSTOMER_UI_COPY[locale]
  const colors =
    tone === 'overlay'
      ? 'bg-white/92 text-brand-navy-deep'
      : days === 0
        ? 'bg-brand-coral-tint text-brand-coral'
        : 'bg-brand-tint text-brand-navy'
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${colors} ${className}`}>
      <ClockIcon size={13} strokeWidth={2.4} />
      {days === 0 ? copy.endsToday : copy.endsInDays(days)}
    </span>
  )
}

export function DistanceText({ km, locale }: { km: number; locale: Locale }) {
  const { value, unit } = formatDistance(km, locale)
  return (
    <>
      <bdi dir="ltr">{value}</bdi> {unit}
    </>
  )
}

// Pin icon + distance, muted. Used on every list row.
export function DistanceLabel({ km, locale, className = '' }: { km: number | null; locale: Locale; className?: string }) {
  if (km == null) return null
  return (
    <span className={`inline-flex items-center gap-1 text-[12.5px] text-brand-muted ${className}`}>
      <PinIcon size={13} strokeWidth={2.2} />
      <span>
        <DistanceText km={km} locale={locale} />
      </span>
    </span>
  )
}

// The shop's own logo (businesses.logo_url — a 512×512 webp written by
// /api/business/[id]/images) in a circle when it has one, otherwise the first
// letter of its name in a tint circle. Fixed width/height either way, so the
// swap never shifts layout. Decorative (aria-hidden): every caller already
// shows the shop name as text right next to it.
export function ShopAvatar({ name, logoUrl, size = 40 }: { name: string; logoUrl?: string | null; size?: number }) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        className="shrink-0 rounded-full border border-brand-line bg-white object-cover"
        style={{ width: size, height: size }}
      />
    )
  }
  const letter = Array.from(name.trim())[0] ?? '?'
  return (
    <span
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center rounded-full bg-brand-tint font-display font-bold text-brand-navy"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.44) }}
    >
      {letter.toUpperCase()}
    </span>
  )
}

// Offer cover: the campaign's own photo when it has one, otherwise a
// tint→tint-2 gradient with the category icon in navy. Badges/chips go in
// `children`, positioned by the caller.
export function CategoryCover({
  category,
  imageUrl,
  iconSize,
  decorated = false,
  className = '',
  children,
}: {
  category: string
  imageUrl: string | null
  iconSize: number
  decorated?: boolean
  className?: string
  children?: ReactNode
}) {
  return (
    <div className={`relative flex items-center justify-center overflow-hidden ${className}`}>
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-brand-tint to-brand-tint-2" />
          {decorated && (
            <>
              <div className="absolute -end-8 -bottom-12 h-36 w-36 rounded-full bg-white/35" />
              <div className="absolute -start-5 -top-10 h-24 w-24 rounded-full bg-white/25" />
            </>
          )}
          <CategoryIcon category={category} size={iconSize} strokeWidth={iconSize > 50 ? 1.5 : 1.8} className="relative text-brand-navy" />
        </>
      )}
      {children}
    </div>
  )
}

// Note on one-line shop-typed text (names, offer titles): the outer span
// keeps the PAGE direction (so text-start aligns with the page), while the
// inner <bdi> is an inline-block that truncates in the TEXT's own
// direction — an English name in an RTL page loses its end, not its start.
