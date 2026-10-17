'use client'

import { useMemo, useState } from 'react'
import type { Locale } from '@/lib/i18n/locale'
import { INTL_LOCALE, OWNER_UI_COPY } from '@/lib/i18n/ownerUi'
import { CalendarIcon, ChevronBackIcon, ChevronForwardIcon, CloseIcon } from '@/components/customer/icons'
import Sheet from './Sheet'
import { PRESS } from '@/components/customer/primitives'

// Day strings are 'YYYY-MM-DD' (the campaigns.start_date/end_date DATE
// columns) and all math is done in UTC so no time zone can shift a day.
export function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10)
}
function fmt(day: string, locale: Locale, opts: Intl.DateTimeFormatOptions) {
  const [y, m, d] = day.split('-').map(Number)
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], { ...opts, timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, d)))
}

// Replaces <input type="date">, which renders in the BROWSER's locale
// (English "mm/dd/yyyy" inside the Arabic UI). Tapping opens a month grid in
// the page language — Gregorian, Latin digits, week starting Sunday; the
// grid follows the page direction (right-to-left in ar/ur).
export default function DateField({
  label,
  value,
  onChange,
  min,
  placeholder,
  locale,
  invalid = false,
  describedBy,
}: {
  label: string
  value: string
  onChange: (day: string) => void
  min?: string
  placeholder: string
  locale: Locale
  invalid?: boolean
  describedBy?: string
}) {
  const copy = OWNER_UI_COPY[locale].form
  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState(() => (value || min || todayStr()).slice(0, 7))

  const weeks = useMemo(() => {
    const [y, m] = month.split('-').map(Number)
    const first = new Date(Date.UTC(y, m - 1, 1))
    const days = new Date(Date.UTC(y, m, 0)).getUTCDate()
    const cells: (string | null)[] = Array(first.getUTCDay()).fill(null)
    for (let d = 1; d <= days; d++) cells.push(`${month}-${String(d).padStart(2, '0')}`)
    while (cells.length % 7) cells.push(null)
    const rows: (string | null)[][] = []
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7))
    return rows
  }, [month])

  const weekdayNames = useMemo(
    () => Array.from({ length: 7 }, (_, i) => fmt(addDays('2026-01-04', i), locale, { weekday: 'narrow' })), // 2026-01-04 is a Sunday
    [locale],
  )

  function shiftMonth(delta: number) {
    const [y, m] = month.split('-').map(Number)
    const d = new Date(Date.UTC(y, m - 1 + delta, 1))
    setMonth(d.toISOString().slice(0, 7))
  }

  const today = todayStr()

  return (
    <div className="min-w-0 flex-1">
      <span className="mb-1.5 block text-sm font-semibold text-brand-navy-deep">{label}</span>
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setMonth((value || min || today).slice(0, 7))
            setOpen(true)
          }}
          aria-label={`${label}: ${value ? fmt(value, locale, { dateStyle: 'full' }) : placeholder}`}
          aria-describedby={describedBy}
          className={`flex min-h-12 w-full items-center gap-2 rounded-2xl border-[1.5px] bg-white px-3.5 text-start text-base ${
            invalid ? 'border-brand-coral' : 'border-brand-line'
          } ${value ? 'text-brand-navy-deep' : 'text-brand-muted'}`}
        >
          <CalendarIcon size={19} className="shrink-0 text-brand-navy" />
          <span className="min-w-0 flex-1 truncate">{value ? fmt(value, locale, { day: 'numeric', month: 'short', year: 'numeric' }) : placeholder}</span>
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label={`${copy.clear}: ${label}`}
            className="absolute end-0.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-brand-muted"
          >
            <CloseIcon size={18} />
          </button>
        )}
      </div>

      <Sheet open={open} onClose={() => setOpen(false)} title={label}>
        <div className="mb-2 flex items-center justify-between">
          <button type="button" onClick={() => shiftMonth(-1)} aria-label={copy.prevMonth} className="flex h-11 w-11 items-center justify-center rounded-full text-brand-navy active:bg-brand-tint">
            <ChevronBackIcon size={22} />
          </button>
          <span aria-live="polite" className="font-display text-[16px] font-semibold">
            {fmt(`${month}-01`, locale, { month: 'long', year: 'numeric' })}
          </span>
          <button type="button" onClick={() => shiftMonth(1)} aria-label={copy.nextMonth} className="flex h-11 w-11 items-center justify-center rounded-full text-brand-navy active:bg-brand-tint">
            <ChevronForwardIcon size={22} />
          </button>
        </div>
        <table className="w-full table-fixed border-separate border-spacing-y-1 text-center" role="grid">
          <thead>
            <tr>
              {weekdayNames.map((n, i) => (
                <th key={i} scope="col" className="pb-1 text-xs font-semibold text-brand-muted">
                  {n}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((row, ri) => (
              <tr key={ri}>
                {row.map((day, ci) => {
                  if (!day) return <td key={ci} />
                  const disabled = Boolean(min && day < min)
                  const selected = day === value
                  return (
                    <td key={ci}>
                      <button
                        type="button"
                        disabled={disabled}
                        aria-pressed={selected}
                        aria-label={fmt(day, locale, { dateStyle: 'full' })}
                        onClick={() => {
                          onChange(day)
                          setOpen(false)
                        }}
                        className={`mx-auto flex h-11 w-11 items-center justify-center rounded-full text-[15px] disabled:text-brand-muted/40 ${PRESS} ${
                          selected
                            ? 'bg-brand-navy font-bold text-white'
                            : day === today
                              ? 'border-2 border-brand-tint-2 font-semibold'
                              : ''
                        }`}
                      >
                        {Number(day.slice(8))}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Sheet>
    </div>
  )
}
