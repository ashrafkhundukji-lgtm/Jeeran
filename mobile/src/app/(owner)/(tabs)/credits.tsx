import { useI18n } from '~/i18n/I18nProvider'
import { useOwnerData } from '~/data/OwnerDataProvider'
import { MessageView, Screen } from '~/ui/layout'
import { ShopHeader } from '~/screens/ShopHeader'

// Milestone 2: credit balance history (ad_credit_transfers). Hidden tab
// until then (see (tabs)/_layout.tsx).
export default function CreditsScreen() {
  const { app } = useI18n()
  const { summary } = useOwnerData()
  return (
    <Screen header={<ShopHeader name={app.tabs.credits} subtitle={summary ? String(summary.business.ad_credits) : undefined} />}>
      <MessageView icon="wallet" title={app.creditsTab.title} body={app.creditsTab.body} />
    </Screen>
  )
}
