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
}: {
  locale: Locale
  onChange: (next: Locale) => void
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
        className="flex items-center gap-2 text-sm border border-neutral-300 rounded-full pl-3 pr-2.5 py-1.5 bg-white text-neutral-700 hover:bg-neutral-50"
      >
        <FlagIcon code={current.code} />
        <span>
          {current.label} ({current.code.toUpperCase()})
        </span>
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
          className="absolute z-20 mt-1 min-w-full w-max bg-white border border-neutral-200 rounded-xl shadow-lg py-1 overflow-hidden"
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
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-start whitespace-nowrap ${
                    selected ? 'bg-blue-50 text-blue-700' : 'text-neutral-700 hover:bg-neutral-50'
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
