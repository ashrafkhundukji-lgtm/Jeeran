import { DateTimePickerAndroid } from '@react-native-community/datetimepicker'
import { useI18n, formatDay } from '~/i18n/I18nProvider'
import { offerToday } from '~/lib/offers'
import { DateRow, type DateFieldProps } from './DateRow'

const pad = (n: number) => String(n).padStart(2, '0')

// Native Android date dialog. Stores a calendar day; the picked Date is
// read in local time so the day the owner tapped is the day saved.
export function DateField({ label, value, emptyLabel, onChange, clearLabel, testID }: DateFieldProps) {
  const { intl, row, rtl } = useI18n()
  function open() {
    const [y, m, d] = (value || offerToday()).split('-').map(Number)
    DateTimePickerAndroid.open({
      value: new Date(y, m - 1, d),
      mode: 'date',
      onChange: (event, date) => {
        if (event.type === 'set' && date) onChange(`${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`)
      },
    })
  }
  return (
    <DateRow
      label={label}
      display={value ? formatDay(value, intl) : emptyLabel}
      hasValue={Boolean(value)}
      onOpen={open}
      onClear={() => onChange('')}
      clearLabel={clearLabel}
      row={row}
      rtl={rtl}
      testID={testID}
    />
  )
}
