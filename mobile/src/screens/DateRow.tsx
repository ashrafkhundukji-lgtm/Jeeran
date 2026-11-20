import { Pressable, View } from 'react-native'
import { Icon } from '~/ui/Icon'
import { Txt } from '~/ui/kit'
import { colors, radius, space, TOUCH } from '~/ui/theme'

export interface DateFieldProps {
  label: string
  value: string // 'YYYY-MM-DD' or ''
  emptyLabel: string
  onChange: (day: string) => void
  clearLabel: string
  testID?: string
}

// The tappable date row shared by DateField.tsx (Android dialog) and
// DateField.web.tsx (web preview).
export function DateRow({
  label,
  display,
  hasValue,
  onOpen,
  onClear,
  clearLabel,
  row,
  testID,
}: {
  label: string
  display: string
  hasValue: boolean
  onOpen: () => void
  onClear: () => void
  clearLabel: string
  row: 'row' | 'row-reverse'
  rtl: boolean
  testID?: string
}) {
  return (
    <View style={{ flexDirection: row, alignItems: 'center', gap: space.sm }}>
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${display}`}
        testID={testID}
        style={{
          flex: 1,
          flexDirection: row,
          alignItems: 'center',
          gap: space.sm,
          minHeight: TOUCH + 4,
          paddingHorizontal: space.md,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.line,
          backgroundColor: colors.white,
        }}
      >
        <Icon name="calendar" size={20} />
        <View style={{ flex: 1 }}>
          <Txt variant="small" color={colors.muted}>
            {label}
          </Txt>
          <Txt variant="bodyStrong" color={hasValue ? colors.ink : colors.muted}>
            {display}
          </Txt>
        </View>
      </Pressable>
      {hasValue ? (
        <Pressable
          onPress={onClear}
          accessibilityRole="button"
          accessibilityLabel={`${clearLabel}: ${label}`}
          style={{ width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="x" color={colors.muted} />
        </Pressable>
      ) : null}
    </View>
  )
}
