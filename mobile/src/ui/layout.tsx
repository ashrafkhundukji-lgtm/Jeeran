import type { ReactNode } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useI18n } from '../i18n/I18nProvider'
import { LOCALES, type Locale } from '../shared/web'
import { Icon, type IconName } from './Icon'
import { Button, Txt } from './kit'
import { colors, radius, space, TOUCH, type } from './theme'

// ── Screen header ───────────────────────────────────────────────────────
// Back arrow points the reading direction's "back" (right in Arabic/Urdu).
export function ScreenHeader({
  title,
  back,
  onBack,
  right,
}: {
  title: string
  back?: boolean
  onBack?: () => void
  right?: ReactNode
}) {
  const { rtl, dash, row } = useI18n()
  const insets = useSafeAreaInsets()
  return (
    <View
      style={{
        paddingTop: insets.top,
        backgroundColor: colors.cream,
        borderBottomWidth: 1,
        borderBottomColor: colors.line,
      }}
    >
      <View style={{ minHeight: 60, flexDirection: row, alignItems: 'center', paddingHorizontal: space.sm, gap: space.xs }}>
        {back ? (
          <Pressable
            onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))}
            accessibilityRole="button"
            accessibilityLabel={dash.common.back}
            hitSlop={6}
            style={{ width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill }}
          >
            <Icon name="arrow-back" rtl={rtl} />
          </Pressable>
        ) : (
          <View style={{ width: space.sm }} />
        )}
        <View style={{ flex: 1 }}>
          <Txt variant="heading" numberOfLines={1} accessibilityRole="header">
            {title}
          </Txt>
        </View>
        {right}
      </View>
    </View>
  )
}

// ── Screen body ─────────────────────────────────────────────────────────
export function Screen({
  children,
  header,
  footer,
  refreshing,
  onRefresh,
  scroll = true,
  contentStyle,
}: {
  children: ReactNode
  header?: ReactNode
  footer?: ReactNode
  refreshing?: boolean
  onRefresh?: () => void
  scroll?: boolean
  contentStyle?: StyleProp<ViewStyle>
}) {
  const insets = useSafeAreaInsets()
  const body = { padding: space.lg, gap: space.lg, paddingBottom: footer ? space.lg : space.xxl + insets.bottom }
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.cream }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {header}
      {scroll ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[body, contentStyle]}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} colors={[colors.navy]} tintColor={colors.navy} /> : undefined
          }
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, body, contentStyle]}>{children}</View>
      )}
      {footer ? (
        <View
          style={{
            backgroundColor: colors.white,
            borderTopWidth: 1,
            borderTopColor: colors.line,
            paddingHorizontal: space.lg,
            paddingTop: space.md,
            paddingBottom: space.md + insets.bottom,
          }}
        >
          {footer}
        </View>
      ) : null}
    </KeyboardAvoidingView>
  )
}

// ── Loading / error / empty ─────────────────────────────────────────────
export function LoadingView({ label }: { label?: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md, backgroundColor: colors.cream }}>
      <ActivityIndicator size="large" color={colors.navy} />
      {label ? (
        <Txt variant="small" color={colors.muted} align="center">
          {label}
        </Txt>
      ) : null}
    </View>
  )
}

export function MessageView({
  icon,
  title,
  body,
  actionLabel,
  onAction,
  tone = 'neutral',
}: {
  icon: IconName
  title: string
  body?: string
  actionLabel?: string
  onAction?: () => void
  tone?: 'neutral' | 'error'
}) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: space.xxl, paddingHorizontal: space.lg, gap: space.md }}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: tone === 'error' ? colors.dangerTint : colors.tint,
        }}
      >
        <Icon name={icon} size={30} color={tone === 'error' ? colors.danger : colors.navy} />
      </View>
      <Txt variant="heading" align="center">
        {title}
      </Txt>
      {body ? (
        <Txt color={colors.muted} align="center">
          {body}
        </Txt>
      ) : null}
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} tone="secondary" style={{ alignSelf: 'stretch' }} /> : null}
    </View>
  )
}

// ── Language switch (ar / en / ur), remembered ───────────────────────────
export function LanguageSwitch() {
  const { locale, setLocale, row } = useI18n()
  return (
    <View
      accessibilityRole="radiogroup"
      style={{ flexDirection: row, backgroundColor: colors.white, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, padding: 3 }}
    >
      {LOCALES.map((l) => {
        const selected = l.code === locale
        return (
          <Pressable
            key={l.code}
            onPress={() => setLocale(l.code as Locale)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={l.label}
            style={{
              flex: 1,
              minHeight: 40,
              paddingHorizontal: space.md,
              borderRadius: radius.pill,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: selected ? colors.navy : 'transparent',
            }}
          >
            <Txt variant="smallStrong" color={selected ? colors.white : colors.navy} align="center" style={{ fontFamily: type.smallStrong.fontFamily }}>
              {l.label}
            </Txt>
          </Pressable>
        )
      })}
    </View>
  )
}
