import { useState, type ReactNode } from 'react'
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { useI18n } from '../i18n/I18nProvider'
import { Icon, type IconName } from './Icon'
import { colors, radius, space, type, TOUCH, type TypeVariant } from './theme'

// ── Text ────────────────────────────────────────────────────────────────
// Aligns to the current language (the app sets layout direction itself,
// see src/app/_layout.tsx), so screens never hard-code left/right.
export function Txt({
  variant = 'body',
  color = colors.ink,
  align,
  style,
  children,
  numberOfLines,
  selectable,
  accessibilityRole,
  testID,
}: {
  variant?: TypeVariant
  color?: string
  align?: TextStyle['textAlign']
  style?: StyleProp<TextStyle>
  children: ReactNode
  numberOfLines?: number
  selectable?: boolean
  accessibilityRole?: 'header' | 'text' | 'alert'
  testID?: string
}) {
  const { align: langAlign, dir } = useI18n()
  return (
    <Text
      numberOfLines={numberOfLines}
      selectable={selectable}
      accessibilityRole={accessibilityRole}
      testID={testID}
      style={[type[variant], { color, textAlign: align ?? langAlign, writingDirection: dir }, style]}
    >
      {children}
    </Text>
  )
}

// ── Buttons ─────────────────────────────────────────────────────────────
type ButtonTone = 'primary' | 'coral' | 'secondary' | 'ghost' | 'danger'

const BUTTON: Record<ButtonTone, { bg: string; fg: string; border: string }> = {
  primary: { bg: colors.navy, fg: colors.white, border: colors.navy },
  coral: { bg: colors.coral, fg: colors.white, border: colors.coral },
  secondary: { bg: colors.white, fg: colors.navy, border: colors.line },
  ghost: { bg: 'transparent', fg: colors.navy, border: 'transparent' },
  danger: { bg: colors.white, fg: colors.danger, border: colors.line },
}

export function Button({
  label,
  onPress,
  tone = 'primary',
  icon,
  loading = false,
  disabled = false,
  style,
  testID,
  accessibilityHint,
}: {
  label: string
  onPress: () => void
  tone?: ButtonTone
  icon?: IconName
  loading?: boolean
  disabled?: boolean
  style?: StyleProp<ViewStyle>
  testID?: string
  accessibilityHint?: string
}) {
  const t = BUTTON[tone]
  const { rtl, row } = useI18n()
  const inactive = disabled || loading
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      android_ripple={{ color: 'rgba(255,255,255,0.18)' }}
      style={({ pressed }) => [
        {
          minHeight: TOUCH + 4,
          borderRadius: radius.md,
          paddingHorizontal: space.lg,
          backgroundColor: t.bg,
          borderWidth: 1,
          borderColor: t.border,
          flexDirection: row,
          alignItems: 'center',
          justifyContent: 'center',
          gap: space.sm,
          opacity: inactive && !loading ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={t.fg} />
      ) : (
        <>
          {icon && <Icon name={icon} size={20} color={t.fg} rtl={rtl} />}
          <Text style={[type.button, { color: t.fg }]}>{label}</Text>
        </>
      )}
    </Pressable>
  )
}

// ── Inputs ──────────────────────────────────────────────────────────────
export function Field({
  label,
  hint,
  error,
  value,
  onChangeText,
  secure = false,
  ltr = false,
  multiline = false,
  showLabel,
  hideLabel,
  ...rest
}: {
  label: string
  hint?: string
  error?: string | null
  value: string
  onChangeText: (v: string) => void
  secure?: boolean
  // Emails/passwords read left-to-right in every language.
  ltr?: boolean
  multiline?: boolean
  showLabel?: string
  hideLabel?: string
} & Omit<TextInputProps, 'value' | 'onChangeText' | 'secureTextEntry' | 'multiline'>) {
  const { align, dir, row } = useI18n()
  const [focused, setFocused] = useState(false)
  const [hidden, setHidden] = useState(true)
  const border = error ? colors.danger : focused ? colors.navy : colors.line
  return (
    <View style={{ gap: space.xs }}>
      <Txt variant="label">{label}</Txt>
      <View
        style={{
          flexDirection: row,
          alignItems: multiline ? 'flex-start' : 'center',
          backgroundColor: colors.white,
          borderWidth: focused || error ? 1.5 : 1,
          borderColor: border,
          borderRadius: radius.md,
          minHeight: TOUCH + 4,
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secure && hidden}
          multiline={multiline}
          placeholderTextColor={colors.muted}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
          style={[
            type.body,
            {
              flex: 1,
              color: colors.ink,
              paddingHorizontal: space.md,
              paddingVertical: space.md,
              minHeight: multiline ? 96 : undefined,
              textAlignVertical: multiline ? 'top' : 'center',
              textAlign: ltr ? 'left' : align,
              writingDirection: ltr ? 'ltr' : dir,
            },
          ]}
          {...rest}
        />
        {secure && (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            accessibilityRole="button"
            accessibilityLabel={hidden ? showLabel : hideLabel}
            hitSlop={8}
            style={{ width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name={hidden ? 'eye' : 'eye-off'} color={colors.muted} />
          </Pressable>
        )}
      </View>
      {error ? (
        <Txt variant="small" color={colors.danger}>
          {error}
        </Txt>
      ) : hint ? (
        <Txt variant="small" color={colors.muted}>
          {hint}
        </Txt>
      ) : null}
    </View>
  )
}

// ── Surfaces ────────────────────────────────────────────────────────────
export function Card({ children, style, padded = true }: { children: ReactNode; style?: StyleProp<ViewStyle>; padded?: boolean }) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.white,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.line,
          padding: padded ? space.lg : 0,
          gap: space.md,
        },
        style,
      ]}
    >
      {children}
    </View>
  )
}

type NoticeTone = 'info' | 'success' | 'warning' | 'danger'
const NOTICE: Record<NoticeTone, { bg: string; fg: string; icon: IconName }> = {
  info: { bg: colors.tint, fg: colors.navy, icon: 'info' },
  success: { bg: colors.successTint, fg: colors.success, icon: 'check-circle' },
  warning: { bg: colors.warningTint, fg: colors.warning, icon: 'alert' },
  danger: { bg: colors.dangerTint, fg: colors.danger, icon: 'alert' },
}

export function Notice({
  tone = 'info',
  title,
  children,
  icon,
  action,
}: {
  tone?: NoticeTone
  title?: string
  children?: ReactNode
  icon?: IconName
  action?: ReactNode
}) {
  const t = NOTICE[tone]
  const { row } = useI18n()
  return (
    <View
      accessibilityRole={tone === 'danger' ? 'alert' : undefined}
      style={{ backgroundColor: t.bg, borderRadius: radius.md, padding: space.md, gap: space.sm }}
    >
      <View style={{ flexDirection: row, gap: space.sm, alignItems: 'flex-start' }}>
        <View style={{ paddingTop: 2 }}>
          <Icon name={icon ?? t.icon} size={20} color={t.fg} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          {title ? (
            <Txt variant="bodyStrong" color={t.fg}>
              {title}
            </Txt>
          ) : null}
          {typeof children === 'string' ? (
            <Txt variant="small" color={colors.ink}>
              {children}
            </Txt>
          ) : (
            children
          )}
        </View>
      </View>
      {action}
    </View>
  )
}

export function Chip({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'success' | 'warning' | 'muted' }) {
  const map = {
    neutral: { bg: colors.tint, fg: colors.navy },
    success: { bg: colors.successTint, fg: colors.success },
    warning: { bg: colors.warningTint, fg: colors.warning },
    muted: { bg: colors.cream, fg: colors.muted },
  }[tone]
  return (
    <View style={{ backgroundColor: map.bg, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' }}>
      <Text style={[type.smallStrong, { color: map.fg }]}>{label}</Text>
    </View>
  )
}

export function Divider() {
  return <View style={{ height: 1, backgroundColor: colors.line }} />
}
