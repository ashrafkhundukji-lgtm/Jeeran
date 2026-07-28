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
    <select
      value={locale}
      onChange={(e) => onChange(e.target.value as Locale)}
      className="text-sm border border-neutral-300 rounded-lg px-2 py-1.5 bg-white text-neutral-700"
    >
      {LOCALES.map((l) => (
        <option key={l.code} value={l.code}>
          {l.label}
        </option>
      ))}
    </select>
  )
}
