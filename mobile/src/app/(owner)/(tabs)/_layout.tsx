import { Tabs } from 'expo-router'
import type { BottomTabBarProps } from 'expo-router/tabs'
import { Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useI18n } from '~/i18n/I18nProvider'
import { Icon, type IconName } from '~/ui/Icon'
import { Txt } from '~/ui/kit'
import { colors, space } from '~/ui/theme'

// Bottom tabs. Milestone 2 screens (scan, credits) already have routes and
// slots here; they are switched on by flipping `enabled`.
const TABS: { name: string; icon: IconName; label: (t: ReturnType<typeof useI18n>['app']['tabs']) => string; enabled: boolean }[] = [
  { name: 'index', icon: 'home', label: (t) => t.home, enabled: true },
  { name: 'offers', icon: 'tag', label: (t) => t.offers, enabled: true },
  { name: 'scan', icon: 'scan', label: (t) => t.scan, enabled: false },
  { name: 'credits', icon: 'wallet', label: (t) => t.credits, enabled: false },
  { name: 'account', icon: 'user', label: (t) => t.account, enabled: true },
]

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.cream } }} tabBar={(props) => <TabBar {...props} />}>
      {TABS.map((t) => (
        <Tabs.Screen key={t.name} name={t.name} options={t.enabled ? undefined : { href: null }} />
      ))}
    </Tabs>
  )
}

// Own tab bar so the order follows the reading direction (Home on the
// right in Arabic/Urdu) and the labels use the app's fonts.
function TabBar({ state, navigateToTab }: BottomTabBarProps) {
  const { app, row } = useI18n()
  const insets = useSafeAreaInsets()
  const current = state.routes[state.index]?.name
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: row,
        backgroundColor: colors.white,
        borderTopWidth: 1,
        borderTopColor: colors.line,
        paddingBottom: insets.bottom,
      }}
    >
      {TABS.filter((t) => t.enabled).map((t) => {
        const focused = current === t.name
        const color = focused ? colors.coral : colors.muted
        return (
          <Pressable
            key={t.name}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={t.label(app.tabs)}
            testID={`tab-${t.name}`}
            onPress={() => {
              const route = state.routes.find((r) => r.name === t.name)
              if (route && !focused) navigateToTab(route.key)
            }}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: space.sm, paddingBottom: space.sm, minHeight: 60, gap: 2 }}
          >
            <View
              style={{
                paddingHorizontal: space.lg,
                paddingVertical: 3,
                borderRadius: 999,
                backgroundColor: focused ? colors.coralTint : 'transparent',
              }}
            >
              <Icon name={t.icon} color={color} size={22} />
            </View>
            <Txt variant="smallStrong" color={color} align="center">
              {t.label(app.tabs)}
            </Txt>
          </Pressable>
        )
      })}
    </View>
  )
}
