import { Alert, Platform, View } from 'react-native'
import Constants from 'expo-constants'
import { useI18n } from '~/i18n/I18nProvider'
import { useAuth } from '~/auth/AuthProvider'
import { useOwnerData } from '~/data/OwnerDataProvider'
import { fill } from '~/shared/web'
import { Button, Card, Notice, Txt } from '~/ui/kit'
import { LanguageSwitch, Screen } from '~/ui/layout'
import { colors, space } from '~/ui/theme'
import { ShopHeader } from '~/screens/ShopHeader'

// Milestone 1: language, who is signed in, sign out. Shop profile editing
// joins this tab in milestone 2.
export default function AccountScreen() {
  const { app, dash, ui } = useI18n()
  const { session, signOut } = useAuth()
  const { summary } = useOwnerData()

  function confirmSignOut() {
    if (Platform.OS === 'web') {
      signOut()
      return
    }
    Alert.alert(dash.profile.signOutConfirm, undefined, [
      { text: ui.common.cancel, style: 'cancel' },
      { text: dash.profile.signOutConfirmYes, style: 'destructive', onPress: () => signOut() },
    ])
  }

  return (
    <Screen header={<ShopHeader name={app.account.heading} subtitle={summary?.business.name} />}>
      <View style={{ gap: space.sm }}>
        <Txt variant="heading">{ui.profile.languageHeading}</Txt>
        <LanguageSwitch />
      </View>

      <Card>
        <Txt variant="label" color={colors.muted}>
          {app.account.signedInAs}
        </Txt>
        <Txt variant="bodyStrong" align="left" selectable>
          {session?.user.email ?? ''}
        </Txt>
      </Card>

      <Notice tone="info" title={app.account.comingSoon}>
        {app.account.comingSoonBody}
      </Notice>

      <Button label={dash.nav.signOut} icon="logout" tone="danger" onPress={confirmSignOut} testID="sign-out" />

      <Txt variant="small" color={colors.muted} align="center">
        {fill(app.account.version, { v: Constants.expoConfig?.version ?? '' })}
      </Txt>
    </Screen>
  )
}
