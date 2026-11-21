import { useI18n } from '~/i18n/I18nProvider'
import { MessageView, Screen } from '~/ui/layout'
import { ShopHeader } from '~/screens/ShopHeader'

// Milestone 2: native camera scanner (POST /api/redeem with the bearer
// token via getRequestAuth). Route exists so the tab slot and deep links
// are ready; the tab is hidden until then (see (tabs)/_layout.tsx).
export default function ScanScreen() {
  const { app } = useI18n()
  return (
    <Screen header={<ShopHeader name={app.tabs.scan} />}>
      <MessageView icon="scan" title={app.scan.title} body={app.scan.body} />
    </Screen>
  )
}
