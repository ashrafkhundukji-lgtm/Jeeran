import { useLocalSearchParams } from 'expo-router'
import { useI18n } from '~/i18n/I18nProvider'
import { useOwnerData } from '~/data/OwnerDataProvider'
import { MessageView, Screen, ScreenHeader } from '~/ui/layout'
import { OfferForm } from '~/screens/OfferForm'

export default function EditOfferScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { summary } = useOwnerData()
  const { ui, dash } = useI18n()
  const campaign = summary?.campaigns.find((c) => c.id === id) ?? null
  if (!campaign) {
    return (
      <Screen header={<ScreenHeader title={ui.form.titleEdit} back />}>
        <MessageView icon="alert" title={dash.campaigns.errorCampaignNotFound} />
      </Screen>
    )
  }
  // key: a fresh form if the offer changes underneath (e.g. after refresh).
  return <OfferForm key={campaign.id} campaign={campaign} />
}
