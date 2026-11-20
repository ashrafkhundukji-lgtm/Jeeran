import { View } from 'react-native'
import { useI18n } from '~/i18n/I18nProvider'
import { useAuth } from '~/auth/AuthProvider'
import { useOwnerData } from '~/data/OwnerDataProvider'
import { Button } from '~/ui/kit'
import { MessageView, Screen } from '~/ui/layout'
import { space } from '~/ui/theme'

// Same as the website's /dashboard/frozen: the shop is paused by Jeeran.
export default function FrozenScreen() {
  const { dash, ui } = useI18n()
  const { signOut } = useAuth()
  const { refresh, refreshing } = useOwnerData()
  return (
    <Screen refreshing={refreshing} onRefresh={refresh} contentStyle={{ paddingTop: space.xxl * 2 }}>
      <MessageView icon="lock" tone="error" title={dash.frozen.heading} body={`${dash.frozen.body}\n\n${dash.frozen.contactSupport}`} />
      <View style={{ gap: space.sm }}>
        <Button label={ui.common.retry} icon="refresh" tone="secondary" onPress={refresh} />
        <Button label={dash.nav.signOut} icon="logout" tone="ghost" onPress={signOut} />
      </View>
    </Screen>
  )
}
