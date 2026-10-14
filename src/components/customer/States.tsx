'use client'

import { useState, type ReactNode } from 'react'
import type { Locale } from '@/lib/i18n/locale'
import { CUSTOMER_UI_COPY } from '@/lib/i18n/customerUi'
import { LocateOffIcon, RefreshIcon, ShareIcon, TagIcon } from './icons'
import { PRESS } from './primitives'

// Empty / error / loading states shared by the customer screens.

export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: ReactNode; body?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[22px] border border-brand-line bg-white px-6 py-8 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-brand-tint text-brand-navy">{icon}</span>
      <h2 className="font-display text-[17px] font-semibold text-brand-navy-deep">{title}</h2>
      {body && <p className="max-w-[300px] text-sm leading-relaxed text-brand-muted">{body}</p>}
      {action}
    </div>
  )
}

// navigator.share of the landing page, with a copy-link fallback.
export function InviteShopButton({ locale }: { locale: Locale }) {
  const copy = CUSTOMER_UI_COPY[locale]
  const [copied, setCopied] = useState(false)

  async function invite() {
    const url = window.location.origin
    try {
      if (navigator.share) {
        await navigator.share({ text: copy.empty.inviteText, url })
        return
      }
      await navigator.clipboard.writeText(`${copy.empty.inviteText} ${url}`)
      setCopied(true)
    } catch {
      // Share sheet dismissed — nothing to do.
    }
  }

  return (
    <button
      type="button"
      onClick={invite}
      className={`mt-1 inline-flex h-12 items-center gap-2 rounded-2xl bg-brand-navy px-5 text-[15px] font-semibold text-white ${PRESS}`}
    >
      <ShareIcon size={18} />
      {copied ? copy.linkCopied : copy.empty.invite}
    </button>
  )
}

export function NoOffersState({ locale }: { locale: Locale }) {
  const copy = CUSTOMER_UI_COPY[locale].empty
  return (
    <EmptyState
      icon={<TagIcon size={30} />}
      title={copy.noOffersTitle}
      body={copy.noOffersBody}
      action={<InviteShopButton locale={locale} />}
    />
  )
}

function RetryButton({ label, onRetry }: { label: string; onRetry: () => void }) {
  return (
    <button
      type="button"
      onClick={onRetry}
      className={`mt-1 inline-flex h-11 items-center gap-2 rounded-2xl border-[1.5px] border-brand-tint-2 px-5 text-sm font-semibold text-brand-navy ${PRESS}`}
    >
      <RefreshIcon size={18} />
      {label}
    </button>
  )
}

export function ErrorState({ locale, onRetry }: { locale: Locale; onRetry: () => void }) {
  const copy = CUSTOMER_UI_COPY[locale]
  return (
    <EmptyState
      icon={<RefreshIcon size={28} />}
      title={copy.empty.errorTitle}
      body={copy.empty.errorBody}
      action={<RetryButton label={copy.retry} onRetry={onRetry} />}
    />
  )
}

export function GeoDeniedState({ locale, onRetry }: { locale: Locale; onRetry: () => void }) {
  const copy = CUSTOMER_UI_COPY[locale]
  return (
    <EmptyState
      icon={<LocateOffIcon size={28} />}
      title={copy.empty.geoTitle}
      body={copy.empty.geoBody}
      action={<RetryButton label={copy.retry} onRetry={onRetry} />}
    />
  )
}

export function OfferListSkeleton({ rows = 3, featured = true }: { rows?: number; featured?: boolean }) {
  return (
    <div aria-hidden="true" className="flex flex-col gap-3">
      {featured && <div className="skeleton h-[210px] rounded-[22px]" />}
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex gap-3 rounded-[18px] border border-brand-line bg-white p-2.5">
          <div className="skeleton h-[92px] w-[92px] flex-none rounded-[14px]" />
          <div className="flex flex-1 flex-col gap-2 py-1">
            <div className="skeleton h-3 w-1/3 rounded-full" />
            <div className="skeleton h-4 w-4/5 rounded-full" />
            <div className="skeleton mt-auto h-3 w-1/4 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}
