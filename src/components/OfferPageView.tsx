'use client'

import { useState } from 'react'
import { useLocale } from '@/lib/i18n/useLocale'
import { getDir, type Locale } from '@/lib/i18n/locale'
import { OFFER_PAGE_COPY } from '@/lib/i18n/offers'
import { CUSTOMER_UI_COPY } from '@/lib/i18n/customerUi'
import { CATEGORY_LABELS } from '@/lib/categories'
import CustomerPage from '@/components/customer/CustomerPage'
import { CategoryCover, DiscountBadge, DistanceText, ExpiryChip, PRESS, ShopAvatar } from '@/components/customer/primitives'
import { ChevronBackIcon, MessageIcon, NavigationIcon, PhoneIcon, PinIcon, ShareIcon } from '@/components/customer/icons'

// Offer landing page (artboard OfferDetail.dc.html). Split from the server
// page.tsx only because useLocale() is client-only; all data is fetched
// server-side and passed down. Title/description come pre-resolved per
// locale (shop translation > fresh auto-translation > original — see the
// server page); business name is shop-typed and never translated.
//
// No bottom nav here, per the artboard: the sticky bar is the page's
// actions. The round back button is the way out — with no same-site
// history (opened straight from the Wallet card) it falls back to the
// Home tab when there's a token, so nobody gets stranded on this page.
export default function OfferPageView({
  offerId,
  isActive,
  imageUrl,
  businessName,
  category,
  content,
  endDate,
  distanceKm,
  directionsUrl,
  whatsappUrl,
  callUrl,
  token,
}: {
  offerId: string
  isActive: boolean
  imageUrl: string | null
  businessName: string
  category: string
  content: Record<Locale, { title: string; description: string | null }>
  endDate: string | null
  distanceKm: number | null
  directionsUrl: string | null
  whatsappUrl: string | null
  callUrl: string | null
  token?: string
}) {
  const [locale] = useLocale()
  const copy = CUSTOMER_UI_COPY[locale]
  const pageCopy = OFFER_PAGE_COPY[locale]
  const dir = getDir(locale)
  const categoryLabel = CATEGORY_LABELS[locale][category] ?? category
  const { title, description } = content[locale]
  const [shareNote, setShareNote] = useState(false)

  function handleBack() {
    try {
      if (document.referrer && new URL(document.referrer).origin === window.location.origin) {
        window.history.back()
        return
      }
    } catch {
      // fall through to the token-based fallback below
    }
    if (token) {
      window.location.href = `/wallet/home?token=${encodeURIComponent(token)}`
    } else {
      window.history.back()
    }
  }

  // Shares the public offer URL WITHOUT the member token — the token
  // identifies this customer and must never leave their device.
  async function handleShare() {
    const url = `${window.location.origin}/offers/${offerId}`
    try {
      if (navigator.share) {
        await navigator.share({ title, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setShareNote(true)
      setTimeout(() => setShareNote(false), 2000)
    } catch {
      // Share sheet dismissed — nothing to do.
    }
  }

  const hasActions = !!(directionsUrl || whatsappUrl || callUrl)
  const roundButton = `flex h-11 w-11 items-center justify-center rounded-full bg-white/92 text-brand-navy-deep ${PRESS}`
  const outlinedAction = `flex h-[54px] w-[54px] flex-none items-center justify-center rounded-2xl border-[1.5px] border-brand-tint-2 text-brand-navy ${PRESS}`

  return (
    <CustomerPage dir={dir} lang={locale} blob={false}>
      <CategoryCover category={category} imageUrl={imageUrl} iconSize={120} decorated className="h-[262px]">
        <div className="absolute inset-x-5 top-5 flex items-center justify-between">
          <button type="button" onClick={handleBack} aria-label={copy.back} className={roundButton}>
            <ChevronBackIcon size={22} strokeWidth={2.2} />
          </button>
          <button type="button" onClick={handleShare} aria-label={copy.share} className={roundButton}>
            <ShareIcon size={20} />
          </button>
        </div>
        {shareNote && (
          <span role="status" className="absolute top-[72px] end-5 rounded-full bg-brand-navy-deep px-3 py-1.5 text-xs font-semibold text-white">
            {copy.linkCopied}
          </span>
        )}
        <DiscountBadge title={title} locale={locale} size="lg" className="absolute start-6 bottom-[46px]" />
      </CategoryCover>

      {/* The sheet runs to the bottom of the screen (262px cover − 28px
          overlap) and carries the action-bar clearance itself, so no cream
          strip shows between it and the sticky bar. */}
      <div
        className={`relative -mt-7 flex min-h-[calc(100dvh-234px)] flex-col gap-4 rounded-t-[28px] bg-white px-6 pt-6 ${
          hasActions ? 'pb-[calc(110px+env(safe-area-inset-bottom,0px))]' : 'pb-10'
        } shadow-[0_-6px_20px_color-mix(in_srgb,var(--color-brand-navy-deep)_6%,transparent)]`}
      >
        {!isActive && (
          <div className="rounded-2xl bg-brand-tint px-4 py-3 text-sm text-brand-navy">
            {pageCopy.inactiveNotice(businessName)}
          </div>
        )}

        <div className="flex items-center gap-3">
          <ShopAvatar name={businessName} size={52} />
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="min-w-0 text-start font-display text-lg font-bold text-brand-navy-deep">
              <bdi className="inline-block max-w-full truncate align-bottom">{businessName}</bdi>
            </span>
            <span className="flex items-center gap-1 text-[13px] text-brand-muted">
              <PinIcon size={14} strokeWidth={2.2} className="shrink-0" />
              <span>
                {categoryLabel}
                {distanceKm != null && (
                  <>
                    {' · '}
                    {copy.awayFromYou(<DistanceText km={distanceKm} locale={locale} />)}
                  </>
                )}
              </span>
            </span>
          </div>
        </div>

        <h1 className="text-start font-display text-[26px] leading-[1.3] font-bold text-brand-navy-deep">
          <bdi>{title}</bdi>
        </h1>

        {description && (
          <p className="text-start text-[15px] leading-[1.6] text-brand-muted">
            <bdi>{description}</bdi>
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <ExpiryChip endDate={endDate} locale={locale} className="px-3 py-1.5 text-[13px]" />
          <span className="rounded-full bg-brand-tint px-3 py-1.5 text-[13px] font-semibold text-brand-navy">
            {copy.detail.oncePerCustomer}
          </span>
        </div>

        <div className="h-px bg-brand-line" />

        <h2 className="font-display text-[17px] font-semibold text-brand-navy-deep">{copy.detail.howTo}</h2>
        <ol className="flex flex-col gap-3">
          {copy.detail.steps.map((step, i) => (
            <li key={i} className="flex items-center gap-3">
              <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-brand-navy font-display text-sm font-semibold text-white">
                {i + 1}
              </span>
              <span className="text-[14.5px] leading-normal">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {hasActions && (
        <div
          className="fixed inset-x-0 bottom-0 z-30 border-t border-brand-line bg-white"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <div className="mx-auto flex max-w-md items-center gap-2.5 px-5 pt-3 pb-5">
            {directionsUrl && (
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex h-[54px] min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl bg-brand-navy font-display text-base font-semibold text-white ${PRESS}`}
              >
                <NavigationIcon size={20} />
                <span className="truncate">{copy.detail.directions}</span>
              </a>
            )}
            {callUrl && (
              <a href={callUrl} aria-label={copy.detail.call} className={outlinedAction}>
                <PhoneIcon size={22} />
              </a>
            )}
            {whatsappUrl && (
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label={copy.detail.whatsapp} className={outlinedAction}>
                <MessageIcon size={22} />
              </a>
            )}
          </div>
        </div>
      )}
    </CustomerPage>
  )
}
