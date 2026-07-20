import { signClaimToken, verifyClaimToken } from './hmac'

// Persistent identity token for the membership pass's barcode. Reuses
// signClaimToken/verifyClaimToken (WALLET_HMAC_SECRET) rather than a second
// signing scheme — see the "why" note in hmac.ts. The value signed here is
// the member's id itself, not a per-scan/per-claim token, since one pass now
// rotates many offers over its lifetime instead of representing a single claim.
export function signMemberToken(memberId: string): string {
  return `${memberId}.${signClaimToken(memberId)}`
}

export function verifyMemberToken(token: string): { memberId: string } | null {
  const [memberId, hash] = token.split('.')
  if (!memberId || !hash) return null
  if (!verifyClaimToken(memberId, hash)) return null
  return { memberId }
}
