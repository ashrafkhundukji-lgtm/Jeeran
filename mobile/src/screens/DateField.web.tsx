import { useState } from 'react'
import { useI18n, formatDay } from '~/i18n/I18nProvider'
import { offerToday } from '~/lib/offers'
import { DateRow, type DateFieldProps } from './DateRow'

// Web preview only (the native date dialog has no web version): tapping
// sets today, then the owner can clear it. The Android app uses
// DateField.tsx.
export function DateField({ label, value, emptyLabel, onChange, clearLabel, testID }: DateFieldProps) {
  const { intl, row, rtl } = useI18n()
  const [, force] = useState(0)
  return (
    <DateRow
      label={label}
      display={value ? formatDay(value, intl) : emptyLabel}
      hasValue={Boolean(value)}
      onOpen={() => {
        onChange(value || offerToday())
        force((n) => n + 1)
      }}
      onClear={() => onChange('')}
      clearLabel={clearLabel}
      row={row}
      rtl={rtl}
      testID={testID}
    />
  )
}
