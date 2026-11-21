import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useI18n } from '~/i18n/I18nProvider'
import { fill } from '~/shared/web'
import { Icon, type IconName } from '~/ui/Icon'
import { Notice, Txt } from '~/ui/kit'
import { colors, space } from '~/ui/theme'

// Top of a tab screen: big title (shop name or screen name) on cream.
export function ShopHeader({ name, subtitle, icon }: { name: string; subtitle?: string; icon?: IconName }) {
  const insets = useSafeAreaInsets()
  const { row } = useI18n()
  return (
    <View
      style={{
        paddingTop: insets.top + space.lg,
        paddingHorizontal: space.lg,
        paddingBottom: space.md,
        backgroundColor: colors.cream,
        borderBottomWidth: 1,
        borderBottomColor: colors.line,
        flexDirection: row,
        alignItems: 'center',
        gap: space.md,
      }}
    >
      {icon ? (
        <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.tint, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={24} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Txt variant="title" numberOfLines={1} accessibilityRole="header">
          {name}
        </Txt>
        {subtitle ? (
          <Txt variant="small" color={colors.muted} numberOfLines={1}>
            {subtitle}
          </Txt>
        ) : null}
      </View>
    </View>
  )
}

export function OfflineBanner({ since }: { since: string }) {
  const { app, intl } = useI18n()
  let time = since
  try {
    time = new Intl.DateTimeFormat(intl, { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }).format(new Date(since))
  } catch {}
  return (
    <Notice tone="info" icon="cloud-off" title={app.offline.banner}>
      {fill(app.offline.savedAt, { time })}
    </Notice>
  )
}
