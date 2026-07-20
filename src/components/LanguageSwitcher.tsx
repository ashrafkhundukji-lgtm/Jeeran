'use client'

import { LOCALES, type Locale } from '@/lib/i18n/locale'

export default function LanguageSwitcher({
  locale,
  onChange,
}: {
  locale: Locale
  onChange: (next: Locale) => void
}) {
  return (
    <div className="flex items-center gap-1 text-sm">
      {LOCALES.map((l, i) => (
        <span key={l.code} className="flex items-center gap-1">
          {i > 0 && <span className="text-neutral-300">·</span>}
          <button onClick={() => onChange(l.code)} className={l.code === locale ? 'font-semibold' : 'text-neutral-400'}>
            {l.label}
          </button>
        </span>
      ))}
    </div>
  )
}
