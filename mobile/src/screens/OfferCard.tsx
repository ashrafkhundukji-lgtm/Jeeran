import { useState } from 'react'
import { Pressable, Switch, View } from 'react-native'
import { router } from 'expo-router'
import { useI18n, formatDay } from '~/i18n/I18nProvider'
import { useOwnerData } from '~/data/OwnerDataProvider'
import { ApiError, type Campaign } from '~/lib/apiClient'
import { offerWindowState } from '~/lib/offers'
import { fill } from '~/shared/web'
import { Icon } from '~/ui/Icon'
import { Card, Chip, Notice, Txt } from '~/ui/kit'
import { colors, radius, space, TOUCH } from '~/ui/theme'
import { errorMessage } from './errors'

// Switching an offer on/off: optimistic, rolled back with the server's
// mapped error (e.g. "you already have another active offer").
export function useToggleOffer() {
  const { setActive } = useOwnerData()
  const { ui, dash } = useI18n()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  async function toggle(id: string, next: boolean) {
    setError('')
    setPendingId(id)
    try {
      await setActive(id, next)
    } catch (e) {
      setError(e instanceof ApiError ? errorMessage(e, { ui, dash }, dash.campaigns.toggleError) : dash.campaigns.toggleError)
    } finally {
      setPendingId(null)
    }
  }
  return { toggle, pendingId, error }
}

export function OfferCard({
  offer,
  pending,
  onToggle,
  disabled,
  testPrefix = '',
}: {
  offer: Campaign
  pending: boolean
  onToggle: (next: boolean) => void
  disabled?: boolean
  // Home and Offers both show the active offer; tabs stay mounted, so the
  // test ids must differ.
  testPrefix?: string
}) {
  const { ui, intl, row, rtl } = useI18n()
  const windowState = offerWindowState(offer.start_date, offer.end_date)
  const dates =
    offer.start_date && offer.end_date
      ? fill(ui.offer.dates, { start: formatDay(offer.start_date, intl), end: formatDay(offer.end_date, intl) })
      : offer.start_date
        ? fill(ui.offer.from, { start: formatDay(offer.start_date, intl) })
        : offer.end_date
          ? fill(ui.offer.until, { end: formatDay(offer.end_date, intl) })
          : null

  return (
    <Card>
      <View style={{ flexDirection: row, alignItems: 'flex-start', gap: space.md }}>
        <View style={{ flex: 1, gap: space.xs }}>
          <View style={{ flexDirection: row, gap: space.xs, flexWrap: 'wrap' }}>
            <Chip label={offer.is_active ? ui.offer.active : ui.offer.inactive} tone={offer.is_active ? 'success' : 'muted'} />
            {windowState === 'ended' ? <Chip label={ui.offer.ended} tone="warning" /> : null}
            {windowState === 'scheduled' && offer.start_date ? (
              <Chip label={fill(ui.offer.scheduled, { date: formatDay(offer.start_date, intl) })} tone="neutral" />
            ) : null}
          </View>
          <Txt variant="subheading" numberOfLines={2}>
            {offer.title}
          </Txt>
          <Txt variant="small" color={colors.muted}>
            {fill(ui.offer.perView, { n: offer.bid_per_view })}
            {dates ? `  ·  ${dates}` : ''}
          </Txt>
        </View>
        <Switch
          value={offer.is_active}
          onValueChange={onToggle}
          disabled={pending || disabled}
          accessibilityLabel={fill(ui.offer.toggleLabel, { title: offer.title })}
          trackColor={{ false: colors.line, true: colors.navy }}
          thumbColor={colors.white}
          testID={`${testPrefix}toggle-${offer.id}`}
        />
      </View>
      {offer.is_active && windowState === 'ended' && offer.end_date ? (
        <Notice tone="warning">{fill(ui.offer.endedNotice, { date: formatDay(offer.end_date, intl) })}</Notice>
      ) : null}
      <Pressable
        onPress={() => router.push({ pathname: '/offer/[id]', params: { id: offer.id } })}
        accessibilityRole="button"
        accessibilityLabel={`${ui.offer.edit}: ${offer.title}`}
        testID={`${testPrefix}edit-${offer.id}`}
        style={({ pressed }) => ({
          flexDirection: row,
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: TOUCH,
          borderTopWidth: 1,
          borderTopColor: colors.line,
          marginHorizontal: -space.lg,
          marginBottom: -space.lg,
          paddingHorizontal: space.lg,
          borderBottomLeftRadius: radius.lg,
          borderBottomRightRadius: radius.lg,
          backgroundColor: pressed ? colors.tint : 'transparent',
        })}
      >
        <View style={{ flexDirection: row, alignItems: 'center', gap: space.sm }}>
          <Icon name="edit" size={18} />
          <Txt variant="bodyStrong" color={colors.navy}>
            {ui.offer.edit}
          </Txt>
        </View>
        <Icon name="chevron-forward" size={18} color={colors.muted} rtl={rtl} />
      </Pressable>
    </Card>
  )
}
