'use client'

import { useRef, useState } from 'react'
import { LOCALES, type Locale } from '@/lib/i18n/locale'

function FlagIcon({ code }: { code: Locale }) {
  const clipId = `flag-clip-${code}`
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" className="shrink-0" aria-hidden="true">
      <defs>
        <clipPath id={clipId}>
          <circle cx="8" cy="8" r="8" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        {code === 'ar' && <rect width="16" height="16" fill="#006C35" />}
        {code === 'ur' && (
          <>
            <rect width="16" height="16" fill="#01411C" />
            <rect width="4" height="16" fill="#ffffff" />
          </>
        )}
        {code === 'en' && (
          <>
            <rect width="16" height="16" fill="#00247D" />
            <path d="M0 0L16 16M16 0L0 16" stroke="#ffffff" strokeWidth="3" />
            <path d="M0 0L16 16M16 0L0 16" stroke="#CF142B" strokeWidth="1.2" />
            <path d="M8 0V16M0 8H16" stroke="#ffffff" strokeWidth="5" />
            <path d="M8 0V16M0 8H16" stroke="#CF142B" strokeWidth="2.2" />
          </>
        )}
      </g>
    </svg>
  )
}

export default function LanguageSwitcher({
  locale,
  onChange,
  compact = false,
  tone = 'light',
}: {
  locale: Locale
  onChange: (next: Locale) => void
  // 'dark' = sitting on the landing hero photo (white outline/text);
  // 'light' = on cream/white pages.
  tone?: 'light' | 'dark'
  // Trigger shows just the code chip ("AR") instead of "{label} (AR)" — used
  // by the landing page's mobile header, where the full label was one of
  // three items wrapping to two rows at 390px (design_handoff_jeeran_mobile/
  // README.md §8). Off by default (signup/login show the full label).
  compact?: boolean
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0]

  // Focus-based close (not a global mousedown listener): closing here is tied
  // to the browser's own focus handoff, so it can't race with — or eat — the
  // click that's supposed to select an option.
  function handleBlur(e: React.FocusEvent<HTMLDivElement>) {
    if (!rootRef.current?.contains(e.relatedTarget as Node | null)) {
      setOpen(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div ref={rootRef} onBlur={handleBlur} onKeyDown={handleKeyDown} className="relative inline-block text-start">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex min-h-11 items-center gap-2 rounded-full border text-sm focus-visible:outline-2 focus-visible:outline-offset-2 ${
          tone === 'dark'
            ? 'border-white/45 bg-white/10 text-white hover:bg-white/20 focus-visible:outline-white'
            : 'border-brand-line bg-white text-brand-navy-deep hover:bg-brand-cream focus-visible:outline-brand-navy'
        } ${compact ? 'ps-3 pe-2.5' : 'ps-3.5 pe-3'}`}
      >
        {!compact && <FlagIcon code={current.code} />}
        <span>{compact ? current.code.toUpperCase() : `${current.label} (${current.code.toUpperCase()})`}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute end-0 z-30 mt-1 min-w-full w-max overflow-hidden rounded-2xl border border-brand-line bg-white py-1 shadow-brand-card"
        >
          {LOCALES.map((l) => {
            const selected = l.code === locale
            return (
              <li key={l.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onChange(l.code)
                    setOpen(false)
                  }}
                  className={`flex min-h-11 w-full items-center gap-2.5 px-3 text-start text-sm whitespace-nowrap ${
                    selected ? 'bg-brand-tint font-medium text-brand-navy-deep' : 'text-brand-muted hover:bg-brand-cream'
                  }`}
                >
                  <span className="w-4 shrink-0" aria-hidden="true">
                    {selected && (
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <span className="flex-1">
                    {l.label} ({l.code.toUpperCase()})
                  </span>
                  <FlagIcon code={l.code} />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
