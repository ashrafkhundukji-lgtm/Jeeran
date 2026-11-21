import type { ApiError } from '~/lib/apiClient'
import { campaignErrorCopyFor, type DashboardCopy, type OwnerUiCopy } from '~/shared/web'

// Turns an API failure into translated copy. Server error strings are
// English and stable; they are mapped (campaignErrorCopyFor, shared with the
// website), never shown raw.
export function errorMessage(
  error: ApiError,
  copy: { ui: OwnerUiCopy; dash: DashboardCopy },
  fallback: string = copy.ui.common.errorBody,
): string {
  if (error.isNetwork) return copy.ui.redeem.networkBody
  return campaignErrorCopyFor(error.serverError, copy.dash.campaigns, fallback)
}
