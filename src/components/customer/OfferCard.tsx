import type { Locale } from '@/lib/i18n/locale'
import { CUSTOMER_UI_COPY } from '@/lib/i18n/customerUi'
import { ChevronForwardIcon, PinIcon } from './icons'
import { CategoryCover, DiscountBadge, DistanceLabel, DistanceText, ExpiryChip, PRESS, ShopAvatar } from './primitives'

// One normalized shape for every offer list (Home strip, Offers list, Scan
// page) — each page maps its own query rows into this, so no list reorders
// or re-fetches anything. Title/businessName are shop-typed: rendered with
// isolated in <bdi> (never dir="auto" on the block, so text-start
// follows the page direction), never translated here.
export interface CardOffer {
  id: string
  href: string
  title: string
  businessName: string
  category: string
  distanceKm: number | null
  imageUrl: string | null
  endDate: string | null
}

type Variant = 'featured' | 'row' | 'compact'

export default function OfferCard({ offer, variant, locale }: { offer: CardOffer; variant: Variant; locale: Locale }) {
  const copy = CUSTOMER_UI_COPY[locale]

  if (variant === 'featured') {
    return (
      <a
        href={offer.href}
        className={`block overflow-hidden rounded-[22px] border border-brand-line bg-white shadow-brand-card ${PRESS}`}
      >
        <CategoryCover category={offer.category} imageUrl={offer.imageUrl} iconSize={76} decorated className="h-[116px]">
          <DiscountBadge title={offer.title} locale={locale} size="md" className="absolute start-3 top-3" />
          <ExpiryChip endDate={offer.endDate} locale={locale} tone="overlay" className="absolute end-3 top-3" />
        </CategoryCover>
        <div className="flex flex-col gap-2.5 px-4 pt-3 pb-3.5">
          <div className="flex items-center gap-3">
            <ShopAvatar name={offer.businessName} size={40} />
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="min-w-0 text-start text-[13px] text-brand-muted">
                <bdi className="inline-block max-w-full truncate align-bottom">{offer.businessName}</bdi>
              </span>
              <span className="text-start text-[17px] leading-[1.35] font-bold text-brand-navy-deep">
                <bdi>{offer.title}</bdi>
              </span>
            </div>
          </div>
          <div className="flex min-h-[44px] items-center justify-between">
            <DistanceLabel km={offer.distanceKm} locale={locale} className="text-[13px]" />
            <span className="ms-auto inline-flex items-center gap-0.5 text-sm font-semibold text-brand-coral">
              {copy.details}
              <ChevronForwardIcon size={18} strokeWidth={2.2} />
            </span>
          </div>
        </div>
      </a>
    )
  }

  if (variant === 'compact') {
    return (
      <a
        href={offer.href}
        className={`block w-[196px] flex-none overflow-hidden rounded-[18px] border border-brand-line bg-white ${PRESS}`}
      >
        <CategoryCover category={offer.category} imageUrl={offer.imageUrl} iconSize={40} className="h-[78px]">
          <DiscountBadge title={offer.title} locale={locale} className="absolute start-2 top-2" />
        </CategoryCover>
        <div className="flex flex-col gap-1.5 px-3 pt-2.5 pb-3">
          <span className="line-clamp-2 min-h-[38px] text-start text-sm leading-[1.35] font-semibold text-brand-navy-deep">
            <bdi>{offer.title}</bdi>
          </span>
          <span className="flex min-w-0 items-center gap-1 text-xs text-brand-muted">
            <PinIcon size={12} strokeWidth={2.4} className="shrink-0" />
            <span className="truncate">
              <bdi>{offer.businessName}</bdi>
              {offer.distanceKm != null && (
                <>
                  {' · '}
                  <DistanceText km={offer.distanceKm} locale={locale} />
                </>
              )}
            </span>
          </span>
        </div>
      </a>
    )
  }

  return (
    <a href={offer.href} className={`flex gap-3 rounded-[18px] border border-brand-line bg-white p-2.5 ${PRESS}`}>
      <CategoryCover
        category={offer.category}
        imageUrl={offer.imageUrl}
        iconSize={38}
        className="h-[92px] w-[92px] flex-none rounded-[14px]"
      >
        <DiscountBadge title={offer.title} locale={locale} className="absolute start-1.5 top-1.5" />
      </CategoryCover>
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-1.5 py-0.5">
        <div className="flex flex-col gap-0.5">
          <span className="min-w-0 text-start text-[12.5px] text-brand-muted">
            <bdi className="inline-block max-w-full truncate align-bottom">{offer.businessName}</bdi>
          </span>
          <span className="line-clamp-2 text-start text-[15px] leading-[1.35] font-bold text-brand-navy-deep">
            <bdi>{offer.title}</bdi>
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <DistanceLabel km={offer.distanceKm} locale={locale} />
          <ExpiryChip endDate={offer.endDate} locale={locale} className="!py-0.5" />
          <span className="ms-auto inline-flex items-center text-[13px] font-semibold text-brand-coral">
            {copy.details}
            <ChevronForwardIcon size={16} strokeWidth={2.2} />
          </span>
        </div>
      </div>
    </a>
  )
}
