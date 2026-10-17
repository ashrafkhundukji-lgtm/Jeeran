import type { ReactNode } from 'react'
import { PRESS } from '@/components/customer/primitives'

// Building blocks for the owner dashboard (navy/coral/cream system — the
// same tokens as the customer screens, see globals.css `brand-*`). Mobile
// first: every interactive element is ≥44px tall, inputs are 16px so iOS
// never zooms on focus.

export const BTN_BASE = `inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 text-[15px] font-semibold disabled:opacity-50 ${PRESS}`
export const BTN_PRIMARY = `${BTN_BASE} bg-brand-navy text-white`
export const BTN_CORAL = `${BTN_BASE} bg-brand-coral text-white shadow-brand-coral`
export const BTN_SECONDARY = `${BTN_BASE} border-[1.5px] border-brand-tint-2 bg-white text-brand-navy`
export const BTN_GHOST = `inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-brand-navy ${PRESS}`

export const LABEL = 'mb-1.5 block text-sm font-semibold text-brand-navy-deep'
export const HINT = 'mt-1.5 text-[13px] leading-relaxed text-brand-muted'
export const INPUT =
  'block min-h-12 w-full rounded-2xl border-[1.5px] border-brand-line bg-white px-4 py-3 text-base text-brand-navy-deep placeholder:text-brand-muted/70 focus:border-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-tint-2 aria-[invalid=true]:border-brand-coral'
export const ERROR_TEXT = 'mt-1.5 text-[13px] font-medium text-brand-coral'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[22px] border border-brand-line bg-white ${className}`}>{children}</div>
}

export function SectionHeading({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-2.5 flex min-h-11 items-center justify-between gap-3">
      <h2 className="font-display text-[17px] font-semibold text-brand-navy-deep">{children}</h2>
      {action}
    </div>
  )
}

// Inline status banner. `tone` picks tint (info), coral (warning/error) or
// navy (success). Icon is passed in so callers choose the right glyph.
export function Notice({
  tone = 'info',
  icon,
  children,
  action,
  className = '',
}: {
  tone?: 'info' | 'warning' | 'success'
  icon?: ReactNode
  children: ReactNode
  action?: ReactNode
  className?: string
}) {
  const tones = {
    info: 'bg-brand-tint text-brand-navy-deep',
    warning: 'bg-brand-coral-tint text-brand-navy-deep',
    success: 'bg-brand-tint text-brand-navy',
  }
  const iconTone = { info: 'text-brand-navy', warning: 'text-brand-coral', success: 'text-brand-navy' }
  return (
    <div role={tone === 'warning' ? 'alert' : 'status'} className={`flex items-start gap-3 rounded-2xl px-4 py-3 ${tones[tone]} ${className}`}>
      {icon && <span className={`mt-0.5 shrink-0 ${iconTone[tone]}`}>{icon}</span>}
      <div className="min-w-0 flex-1 text-sm leading-relaxed">{children}</div>
      {action}
    </div>
  )
}

// Shop-typed text (names, offer titles): page direction for alignment, text
// direction isolated so mixed Arabic/Latin never reorders.
export function ShopText({ children, className = '' }: { children: string; className?: string }) {
  return (
    <bdi dir="auto" className={className}>
      {children}
    </bdi>
  )
}
