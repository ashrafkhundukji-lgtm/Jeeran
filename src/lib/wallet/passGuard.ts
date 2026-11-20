import { NextResponse, type NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getHostBusiness, type HostBusiness } from '@/lib/matchmaking'
import { getCampaignForClaim, type CampaignForClaim } from '@/lib/wallet/data'
import { LIMITS, validDeviceId } from '@/lib/abuseLimits'
import { hashedClientIp, rateLimitHit } from '@/lib/rateLimit'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Shared gate for the anonymous Wallet pass creation routes. Customers stay
// anonymous, but nobody can mint unlimited pass objects:
//  1. ids must be UUIDs (400)
//  2. per-IP (hashed) and per-device (jeeran_device_id cookie) rate limits (429)
//     — counted before any lookup, so probing ids also uses up the limit
//  3. the offer must pass THE shared eligibility rule, eligible_offers() (404)
//  4. the host shop must exist and not be frozen (404)
export async function guardPassRequest(
  req: NextRequest,
  body: { campaign_id?: unknown; host_business_id?: unknown } | null,
): Promise<{ ok: true; campaign: CampaignForClaim; host: HostBusiness } | { ok: false; response: NextResponse }> {
  const fail = (status: number, error: string) => ({ ok: false as const, response: NextResponse.json({ error }, { status }) })
  const campaignId = body?.campaign_id
  const hostBusinessId = body?.host_business_id
  if (typeof campaignId !== 'string' || typeof hostBusinessId !== 'string' || !UUID.test(campaignId) || !UUID.test(hostBusinessId)) {
    return fail(400, 'campaign_id and host_business_id are required')
  }

  const ipKey = hashedClientIp(req.headers) ?? 'unknown'
  if (!(await rateLimitHit(`pass:ip:${ipKey}`, LIMITS.passPerIp))) return fail(429, 'Too many requests, try again later')
  const device = req.cookies.get('jeeran_device_id')?.value
  if (validDeviceId(device) && !(await rateLimitHit(`pass:device:${device}`, LIMITS.passPerDevice))) {
    return fail(429, 'Too many requests, try again later')
  }

  const { data: eligible, error } = await supabaseAdmin.rpc('eligible_offers').eq('offer_id', campaignId).limit(1)
  if (error) return fail(500, error.message)
  if (!eligible || eligible.length === 0) return fail(404, 'Campaign not found or inactive')

  const [campaign, host] = await Promise.all([getCampaignForClaim(campaignId), getHostBusiness(hostBusinessId)])
  if (!campaign || !campaign.isActive) return fail(404, 'Campaign not found or inactive')
  if (!host || host.isFrozen) return fail(404, 'Host business not found')
  return { ok: true, campaign, host }
}
