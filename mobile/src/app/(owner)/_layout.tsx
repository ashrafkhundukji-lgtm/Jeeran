import { Stack } from 'expo-router'
import { View } from 'react-native'
import { OwnerDataProvider, useOwnerData } from '~/data/OwnerDataProvider'
import { useI18n } from '~/i18n/I18nProvider'
import { useAuth } from '~/auth/AuthProvider'
import { LoadingView, MessageView } from '~/ui/layout'
import { Button } from '~/ui/kit'
import { colors, space } from '~/ui/theme'
import { errorMessage } from '~/screens/errors'

export default function OwnerLayout() {
  const { session } = useAuth()
  return (
    <OwnerDataProvider key={session?.user.id ?? 'none'}>
      <OwnerGate />
    </OwnerDataProvider>
  )
}

// Which part of the owner app is reachable, from the shop's state — same
// order as the website's dashboard: no shop → onboarding, frozen → frozen
// screen, otherwise the tabs.
function OwnerGate() {
  const { state, summary, refresh } = useOwnerData()
  const { app, ui, dash } = useI18n()
  const { signOut } = useAuth()

  if (state.kind === 'loading') return <LoadingView label={app.loading} />
  if (state.kind === 'error' && !summary) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.cream, padding: space.lg, gap: space.md }}>
        <MessageView
          icon={state.error.isNetwork ? 'cloud-off' : 'alert'}
          tone="error"
          title={ui.common.errorTitle}
          body={errorMessage(state.error, { ui, dash })}
          actionLabel={ui.common.retry}
          onAction={refresh}
        />
        <Button label={dash.nav.signOut} tone="ghost" icon="logout" onPress={signOut} />
      </View>
    )
  }

  const onboarding = state.kind === 'needs_onboarding'
  const frozen = Boolean(summary?.business.is_frozen)
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.cream } }}>
      <Stack.Protected guard={onboarding}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={!onboarding && frozen}>
        <Stack.Screen name="frozen" />
      </Stack.Protected>
      <Stack.Protected guard={!onboarding && !frozen}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="offer/new" />
        <Stack.Screen name="offer/[id]" />
      </Stack.Protected>
    </Stack>
  )
}
