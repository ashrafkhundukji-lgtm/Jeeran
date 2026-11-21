import type { AppCopy } from '~/i18n/appCopy'
import type { Campaign, OfferStatusReason } from '~/lib/apiClient'
import { fill, type DashboardCopy, type OwnerUiCopy } from '~/shared/web'
import { formatDay } from '~/i18n/I18nProvider'

// The owner-facing sentence for each "not showing" reason that
// owner_offer_eligibility() returns. Reuses the website's own sentences
// where it has one.
export function reasonMessage(
  reason: OfferStatusReason | null,
  ctx: { ui: OwnerUiCopy; dash: DashboardCopy; app: AppCopy; intl: string; offer: Campaign | null },
): string {
  const { ui, dash, app, intl, offer } = ctx
  switch (reason) {
    case 'frozen':
      return dash.frozen.body
    case 'subscription':
      return ui.balance.inactive
    case 'no_offer':
      return ui.offer.emptyBody
    case 'switched_off':
      return app.status.switchedOff
    case 'not_started':
      return offer?.start_date ? fill(ui.offer.scheduledNotice, { date: formatDay(offer.start_date, intl) }) : app.status.unknown
    case 'ended':
      return offer?.end_date ? fill(ui.offer.endedNotice, { date: formatDay(offer.end_date, intl) }) : app.status.unknown
    case 'credits':
      return fill(ui.offer.pausedCredits, { bid: offer?.bid_per_view ?? '' })
    default:
      return app.status.unknown
  }
}
