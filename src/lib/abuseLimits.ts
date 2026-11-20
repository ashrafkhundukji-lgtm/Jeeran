// Pure policy + helpers for the anonymous customer routes (unit-tested
// without Next). Enforcement: rate_limit_hit() in the database, see
// src/lib/rateLimit.ts.

const HOUR = 3600
const DAY = 86400

export const LIMITS = {
  // Wallet pass creation (POST /api/wallet/google/generate, /api/wallet/generate)
  passPerIp: { max: 20, windowSeconds: HOUR },
  passPerDevice: { max: 10, windowSeconds: HOUR },
  // Signup bonus (POST /api/wallet/membership/create). The member is always
  // created; only the BONUS is skipped past these. Generous because many
  // phones on one mobile network can share an IP.
  bonusPerIpPerShop: { max: 50, windowSeconds: DAY },
  bonusPerIp: { max: 100, windowSeconds: DAY },
} as const

// First hop of x-forwarded-for (set by Vercel's edge), else x-real-ip.
export function clientIpFrom(headers: { get(name: string): string | null }): string | null {
  const fwd = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const ip = fwd || headers.get('x-real-ip')?.trim() || ''
  return ip && ip.length <= 64 && /^[0-9a-fA-F:.]+$/.test(ip) ? ip : null
}

const DEVICE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export function validDeviceId(value: string | undefined | null): value is string {
  return !!value && DEVICE_ID.test(value)
}
