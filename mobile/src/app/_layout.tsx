import { useEffect } from 'react'
import { View } from 'react-native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { useFonts } from 'expo-font'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { I18nProvider, useI18n } from '~/i18n/I18nProvider'
import { AuthProvider, useAuth } from '~/auth/AuthProvider'
import { FONT_FILES } from '~/ui/fontFiles'
import { colors } from '~/ui/theme'
import { configMissing } from '~/lib/config'
import { MessageView } from '~/ui/layout'
import { fill } from '~/shared/web'

SplashScreen.preventAutoHideAsync().catch(() => {})

// Layout direction: the app does not use React Native's I18nManager
// (android:supportsRtl is off). Arabic/Urdu mirroring is done by the app
// itself from the chosen language (rows via useI18n().row, text alignment
// via <Txt>), so switching language takes effect at once, with no restart.
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(FONT_FILES)
  return (
    <SafeAreaProvider>
      <I18nProvider>
        <AuthProvider>
          <StatusBar style="dark" />
          <Root fontsReady={fontsLoaded || Boolean(fontError)} />
        </AuthProvider>
      </I18nProvider>
    </SafeAreaProvider>
  )
}

function Root({ fontsReady }: { fontsReady: boolean }) {
  const { ready: i18nReady, app } = useI18n()
  const { session } = useAuth()
  const ready = fontsReady && i18nReady && session !== undefined

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {})
  }, [ready])

  if (!ready) return <View style={{ flex: 1, backgroundColor: colors.cream }} />

  if (configMissing.length) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.cream }}>
        <MessageView icon="alert" tone="error" title={fill(app.configMissing, { keys: configMissing.join(', ') })} />
      </View>
    )
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.cream } }}>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={Boolean(session)}>
        <Stack.Screen name="(owner)" />
      </Stack.Protected>
    </Stack>
  )
}
