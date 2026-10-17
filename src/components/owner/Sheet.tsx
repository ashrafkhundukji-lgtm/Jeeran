'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { useLocale } from '@/lib/i18n/useLocale'
import { getDir } from '@/lib/i18n/locale'
import { OWNER_UI_COPY } from '@/lib/i18n/ownerUi'
import { CloseIcon } from '@/components/customer/icons'

// Bottom sheet dialog: backdrop tap / Escape / close button dismiss it,
// focus moves into the sheet on open and back to the opener on close, page
// scroll is locked meanwhile. z-[1100] clears Leaflet's panes (z ≤ 1000) on
// the profile page. Constrained to the same 480px column as the shell.
export default function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
}) {
  const [locale] = useLocale()
  const panelRef = useRef<HTMLDivElement>(null)
  // Callers pass inline closures; keep the latest in a ref so the open/close
  // effect below only runs on `open` changes (re-running it would steal focus).
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    const opener = document.activeElement as HTMLElement | null
    panelRef.current?.focus()
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
      opener?.focus?.()
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[1100] flex items-end justify-center bg-brand-navy-deep/45" onClick={onClose}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        dir={getDir(locale)}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[88dvh] w-full max-w-[480px] flex-col rounded-t-[28px] bg-white font-body text-brand-navy-deep outline-none"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-center gap-2 px-5 pt-3">
          <h2 className="min-w-0 flex-1 font-display text-[18px] font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={OWNER_UI_COPY[locale].common.close}
            className="-me-2 flex h-11 w-11 items-center justify-center rounded-full text-brand-muted active:bg-brand-tint"
          >
            <CloseIcon size={22} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 pt-2 pb-5">{children}</div>
        {footer && <div className="border-t border-brand-line px-5 py-3">{footer}</div>}
      </div>
    </div>
  )
}
