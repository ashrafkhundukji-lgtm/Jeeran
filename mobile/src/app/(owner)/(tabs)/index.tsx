import { View } from 'react-native'
import { router } from 'expo-router'
import { useI18n, formatDay } from '~/i18n/I18nProvider'
import { useOwnerData } from '~/data/OwnerDataProvider'
import { activeCampaign, actionForReason, runway } from '~/lib/offers'
import { CATEGORY_LABELS, fill } from '~/shared/web'
import { Icon, CATEGORY_ICON } from '~/ui/Icon'
import { Button, Card, Notice, Txt } from '~/ui/kit'
import { Screen } from '~/ui/layout'
import { colors, radius, space } from '~/ui/theme'
import { OfferCard, useToggleOffer } from '~/screens/OfferCard'
import { reasonMessage } from '~/screens/offerStatus'
import { OfflineBanner, ShopHeader } from '~/screens/ShopHeader'
import { errorMessage } from '~/screens/errors'

const LOW_RUNWAY_VIEWS = 10

export default function HomeScreen() {
  const i18n = useI18n()
  const { ui, dash, app, intl, locale, row } = i18n
  const { summary, refresh, refreshing, offlineSince, refreshError } = useOwnerData()
  const { toggle, pendingId, error: toggleError } = useToggleOffer()
  if (!summary) return null

  const { business, campaigns, offerStatus, exposure } = summary
  const active = activeCampaign(campaigns)
  const statusOffer = campaigns.find((c) => c.id === offerStatus?.offerId) ?? active
  const action = offerStatus && !offerStatus.showing ? actionForReason(offerStatus.reason) : 'none'
  const views = active ? runway(business.ad_credits, active.bid_per_view) : null

  return (
    <Screen
      header={<ShopHeader name={business.name} subtitle={CATEGORY_LABELS[locale][business.category] ?? business.category} icon={CATEGORY_ICON[business.category] ?? 'store'} />}
      refreshing={refreshing}
      onRefresh={refresh}
    >
      {offlineSince ? <OfflineBanner since={offlineSince} /> : null}
      {refreshError && !offlineSince ? <Notice tone="danger">{errorMessage(refreshError, { ui, dash })}</Notice> : null}

      {/* Showing / not showing, and why — from the shared eligibility rule. */}
      {offerStatus ? (
        offerStatus.showing ? (
          <Notice tone="success" icon="check-circle" title={app.status.showingTitle}>
            {app.status.showingBody}
          </Notice>
        ) : (
          <Notice
            tone="warning"
            title={app.status.notShowingTitle}
            action={
              action === 'create' ? (
                <Button label={app.status.createOffer} icon="plus" tone="coral" onPress={() => router.push('/offer/new')} />
              ) : action === 'switch_on' && statusOffer ? (
                <Button
                  label={app.status.switchOn}
                  icon="power"
                  loading={pendingId === statusOffer.id}
                  onPress={() => toggle(statusOffer.id, true)}
                  testID="status-switch-on"
                />
              ) : action === 'edit' && statusOffer ? (
                <Button
                  label={app.status.editOffer}
                  icon="edit"
                  tone="secondary"
                  onPress={() => router.push({ pathname: '/offer/[id]', params: { id: statusOffer.id } })}
                />
              ) : null
            }
          >
            {reasonMessage(offerStatus.reason, { ui, dash, app, intl, offer: statusOffer })}
          </Notice>
        )
      ) : (
        <Notice tone="info">{app.status.unavailable}</Notice>
      )}

      {exposure?.inGrace && exposure.endsAt ? (
        <Notice tone="warning">{fill(ui.balance.grace, { date: formatDay(exposure.endsAt.slice(0, 10), intl) })}</Notice>
      ) : null}

      {/* Credits */}
      <Card>
        <View style={{ flexDirection: row, alignItems: 'center', gap: space.sm }}>
          <Icon name="wallet" size={20} />
          <Txt variant="label" color={colors.muted}>
            {ui.balance.label}
          </Txt>
        </View>
        <Txt variant="number" testID="credits-balance">
          {String(business.ad_credits)}
        </Txt>
        <Txt variant="small" color={colors.muted}>
          {active && views != null ? fill(ui.balance.runway, { n: views, bid: active.bid_per_view }) : ui.balance.runwayNoOffer}
        </Txt>
        {business.ad_credits <= 0 ? (
          <Notice tone="danger">{ui.balance.empty}</Notice>
        ) : views != null && views < LOW_RUNWAY_VIEWS ? (
          <Notice tone="warning">{ui.balance.low}</Notice>
        ) : null}
        <Txt variant="small" color={colors.muted}>
          {app.home.topUpOnWeb}
        </Txt>
      </Card>

      {/* Active offer */}
      <View style={{ gap: space.sm }}>
        <Txt variant="heading">{ui.offer.activeHeading}</Txt>
        {toggleError ? <Notice tone="danger">{toggleError}</Notice> : null}
        {active ? (
          <OfferCard offer={active} pending={pendingId === active.id} onToggle={(next) => toggle(active.id, next)} testPrefix="home-" />
        ) : (
          <Card style={{ alignItems: 'stretch' }}>
            <Txt variant="subheading">{ui.offer.emptyTitle}</Txt>
            <Txt color={colors.muted}>{ui.offer.emptyBody}</Txt>
            <Button label={ui.offer.create} icon="plus" tone="coral" onPress={() => router.push('/offer/new')} testID="home-create-offer" />
          </Card>
        )}
      </View>

      {/* Quick actions */}
      <View style={{ gap: space.sm }}>
        <Txt variant="heading">{app.home.quickActions}</Txt>
        <View style={{ flexDirection: row, gap: space.sm }}>
          <QuickAction icon="plus" label={app.home.newOffer} onPress={() => router.push('/offer/new')} />
          <QuickAction icon="tag" label={app.home.allOffers} onPress={() => router.navigate('/offers')} />
          <QuickAction icon="globe" label={app.home.language} onPress={() => router.navigate('/account')} />
        </View>
      </View>
    </Screen>
  )
}

function QuickAction({ icon, label, onPress }: { icon: 'plus' | 'tag' | 'globe'; label: string; onPress: () => void }) {
  return (
    <View style={{ flex: 1 }}>
      <Button
        label={label}
        icon={icon}
        tone="secondary"
        onPress={onPress}
        style={{ flexDirection: 'column', minHeight: 84, paddingVertical: space.md, borderRadius: radius.lg, gap: space.xs }}
      />
    </View>
  )
}
