import { View } from 'react-native'
import { router } from 'expo-router'
import { useI18n } from '~/i18n/I18nProvider'
import { useOwnerData } from '~/data/OwnerDataProvider'
import { sortCampaigns } from '~/lib/offers'
import { Button, Notice } from '~/ui/kit'
import { MessageView, Screen } from '~/ui/layout'
import { space } from '~/ui/theme'
import { OfferCard, useToggleOffer } from '~/screens/OfferCard'
import { OfflineBanner, ShopHeader } from '~/screens/ShopHeader'

export default function OffersScreen() {
  const { ui, app } = useI18n()
  const { summary, refresh, refreshing, offlineSince } = useOwnerData()
  const { toggle, pendingId, error } = useToggleOffer()
  if (!summary) return null
  const offers = sortCampaigns(summary.campaigns)

  return (
    <Screen
      header={<ShopHeader name={ui.offer.allHeading} />}
      refreshing={refreshing}
      onRefresh={refresh}
      footer={<Button label={ui.offer.newCampaign} icon="plus" tone="coral" onPress={() => router.push('/offer/new')} testID="offers-new" />}
    >
      {offlineSince ? <OfflineBanner since={offlineSince} /> : null}
      {error ? <Notice tone="danger">{error}</Notice> : null}
      {offers.length === 0 ? (
        <MessageView icon="tag" title={ui.offer.emptyTitle} body={app.offers.empty} />
      ) : (
        <View style={{ gap: space.md }}>
          {offers.map((o) => (
            <OfferCard key={o.id} offer={o} pending={pendingId === o.id} onToggle={(next) => toggle(o.id, next)} disabled={Boolean(offlineSince)} />
          ))}
        </View>
      )}
    </Screen>
  )
}
