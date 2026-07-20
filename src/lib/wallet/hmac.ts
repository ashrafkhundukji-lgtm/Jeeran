import { createHmac, timingSafeEqual } from 'node:crypto'

function getSecret(): string {
  const secret = process.env.WALLET_HMAC_SECRET
  if (!secret) throw new Error('WALLET_HMAC_SECRET is not configured')
  return secret
}

// Signs over an opaque token alone (not campaign+host — see Sprint 3 notes
// in supabase/migrations/20260713_sprint3_schema.sql for why: campaign+host
// isn't unique per pass, so it couldn't support redemption/double-spend
// checks). Two callers rely on this today with different token semantics:
// - the legacy one-off pass flow signs a claim token, the primary key of the
//   scans_and_claims row created for that specific pass (see /api/validate).
// - src/lib/wallet/member-token.ts signs a wallet_members.id instead, since
//   a membership pass identifies a persistent customer, not a single claim.
// Same HMAC mechanism either way — just what string gets signed differs.
export function signClaimToken(claimToken: string): string {
  return createHmac('sha256', getSecret()).update(claimToken).digest('hex')
}

export function verifyClaimToken(claimToken: string, hash: string): boolean {
  const expected = Buffer.from(signClaimToken(claimToken))
  const given = Buffer.from(hash)
  if (expected.length !== given.length) return false
  return timingSafeEqual(expected, given)
}
