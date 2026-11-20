import type { ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import { useI18n } from '~/i18n/I18nProvider'
import { JeeranMark } from '~/ui/JeeranMark'
import { Txt } from '~/ui/kit'
import { LanguageSwitch, Screen } from '~/ui/layout'
import { colors, space } from '~/ui/theme'

// Shared frame for login / signup / forgot password: mark, language switch,
// heading, then the form.
export function AuthFrame({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const { row, app } = useI18n()
  return (
    <Screen contentStyle={{ paddingTop: space.xxl + space.lg, gap: space.xl }}>
      <View style={{ flexDirection: row, alignItems: 'center', justifyContent: 'space-between', gap: space.md }}>
        <View style={{ flexDirection: row, alignItems: 'center', gap: space.sm }}>
          <JeeranMark size={40} />
          <Txt variant="subheading">{app.appName}</Txt>
        </View>
      </View>
      <LanguageSwitch />
      <View style={{ gap: space.xs }}>
        <Txt variant="title" accessibilityRole="header">
          {title}
        </Txt>
        {subtitle ? <Txt color={colors.muted}>{subtitle}</Txt> : null}
      </View>
      <View style={{ gap: space.lg }}>{children}</View>
    </Screen>
  )
}

export function TextLink({ label, onPress, prompt }: { label: string; onPress: () => void; prompt?: string }) {
  const { row } = useI18n()
  return (
    <View style={{ flexDirection: row, alignItems: 'center', justifyContent: 'center', gap: space.xs, flexWrap: 'wrap' }}>
      {prompt ? (
        <Txt color={colors.muted} align="center">
          {prompt}
        </Txt>
      ) : null}
      <Pressable onPress={onPress} accessibilityRole="link" hitSlop={10} style={{ minHeight: 44, justifyContent: 'center' }}>
        <Txt variant="bodyStrong" color={colors.coral} align="center">
          {label}
        </Txt>
      </Pressable>
    </View>
  )
}
