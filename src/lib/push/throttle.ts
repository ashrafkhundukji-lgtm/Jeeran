import type { OwnerPushType } from '../i18n/ownerPush'

// Server-side throttle per shop and type: at most `max` sends per window.
// Enforced atomically by claim_owner_push_slot() (see
// supabase/migrations/20261120_owner_push.sql); this table is the policy.
// "signups" is the collapse rule: one message an hour, carrying a count.
export const PUSH_THROTTLE: Record<OwnerPushType, { max: number; windowSeconds: number }> = {
  redeemed: { max: 6, windowSeconds: 3600 },
  earned: { max: 6, windowSeconds: 3600 },
  signups: { max: 1, windowSeconds: 3600 },
  offer_status: { max: 3, windowSeconds: 3600 },
  trial: { max: 1, windowSeconds: 30 * 86400 },
  test: { max: 5, windowSeconds: 600 },
}

// Same decision the SQL function makes, for a list of earlier send times.
export function throttleAllows(type: OwnerPushType, earlierSends: Date[], now: Date): boolean {
  const { max, windowSeconds } = PUSH_THROTTLE[type]
  const from = now.getTime() - windowSeconds * 1000
  return earlierSends.filter((t) => t.getTime() > from).length < max
}
