import type { DashboardCopy } from '@/lib/i18n/dashboard'

// Maps /api/campaigns and /api/campaigns/[id]'s own known error strings to
// localized copy — those routes return raw English text, so showing
// `body.error` directly (the previous behavior) meant every specific error
// stayed English regardless of the dashboard's selected language, even
// though the fallback generic message was already translated. Anything not
// in this list (an unexpected 500, a raw Postgres error) falls back to the
// given translated generic message instead of leaking raw English text.
// Shared by the owner home (toggle) and the campaign form (create/edit).
export function campaignErrorCopyFor(rawError: string, copy: DashboardCopy['campaigns'], fallback: string): string {
  switch (rawError) {
    case 'Not authenticated':
      return copy.errorNotAuthenticated
    case 'This account is frozen':
      return copy.errorFrozen
    case 'No business found for this account':
      return copy.errorNoBusiness
    case 'Title is required':
      return copy.errorTitleRequired
    case 'bid_per_view must be between 2 and 10':
      return copy.errorBidRange
    case 'End date must be on or after the start date':
      return copy.endDateError
    case 'You already have an active campaign — deactivate it before creating another.':
      return copy.errorAlreadyActiveCreate
    case 'You already have another active campaign — deactivate it first.':
      return copy.errorAlreadyActiveToggle
    case 'Campaign not found':
      return copy.errorCampaignNotFound
    default:
      return fallback
  }
}
