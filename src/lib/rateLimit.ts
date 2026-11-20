import { createHmac } from 'node:crypto'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { clientIpFrom } from '@/lib/abuseLimits'

// Rate limits for anonymous routes. IPs are never stored: the key holds an
// HMAC of the IP (keyed with the server's WALLET_HMAC_SECRET, domain
// "ip:"), and rows live only as long as the longest window (pruned on every
// hit for that key and daily by /api/cron/keepalive).

export function hashIp(ip: string): string {
  const secret = process.env.WALLET_HMAC_SECRET
  if (!secret) throw new Error('WALLET_HMAC_SECRET is not set')
  return createHmac('sha256', secret).update(`ip:${ip}`).digest('hex').slice(0, 32)
}

export function hashedClientIp(headers: Headers): string | null {
  const ip = clientIpFrom(headers)
  return ip ? hashIp(ip) : null
}

// true = allowed (and counted). Fails closed: a database error counts as
// "not allowed", so an outage can't be used to bypass the limit.
export async function rateLimitHit(key: string, limit: { max: number; windowSeconds: number }): Promise<boolean> {
  const { data, error } = await supabaseAdmin.rpc('rate_limit_hit', {
    p_key: key.slice(0, 200),
    p_max: limit.max,
    p_window_seconds: limit.windowSeconds,
  })
  if (error) {
    console.error('rate_limit_hit failed', { key: key.split(':')[0], error: error.message })
    return false
  }
  return data === true
}
