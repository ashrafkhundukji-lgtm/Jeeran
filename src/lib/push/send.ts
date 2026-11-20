import webpush from 'web-push'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { buildOwnerPushPayload, type OwnerPushInput, type OwnerPushPayload, type OwnerPushType } from '@/lib/i18n/ownerPush'
import { PUSH_THROTTLE } from './throttle'

// Server-side Web Push sender for shop owners. Everything here is meant to
// run inside after() (see ./events.ts): it never throws to its caller and
// logs instead, so a push problem can't fail or slow a redemption, signup
// or cron run.
//
// Env (read here only):
//   NEXT_PUBLIC_VAPID_PUBLIC_KEY  VAPID public key (also used by the browser)
//   VAPID_PRIVATE_KEY             VAPID private key — server only, never commit
//   VAPID_SUBJECT                 mailto: (or https:) contact for push services
//   OWNER_PUSH_STUB_URL           tests only: deliver the real encrypted
//                                 request to this URL instead of the push
//                                 service. Ignored on Vercel production.

export type PrefKey = 'redeemed' | 'earned' | 'signups' | 'offer_status' | 'trial'

const TTL_SECONDS: Record<OwnerPushType, number> = {
  redeemed: 6 * 3600,
  earned: 24 * 3600,
  signups: 24 * 3600,
  offer_status: 3 * 86400,
  trial: 3 * 86400,
  test: 600,
}

let vapidReady: boolean | null = null
function ensureVapid(): boolean {
  if (vapidReady !== null) return vapidReady
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT
  if (!publicKey || !privateKey || !subject) {
    console.error('owner push: VAPID env missing (NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT) — pushes disabled')
    vapidReady = false
    return false
  }
  webpush.setVapidDetails(subject, publicKey, privateKey)
  vapidReady = true
  return true
}

function stubUrl(): string | null {
  const url = process.env.OWNER_PUSH_STUB_URL
  if (!url) return null
  if (process.env.VERCEL_ENV === 'production') return null
  return url
}

interface SubscriptionRow {
  id: string
  endpoint: string
  p256dh: string
  auth: string
}

// Sends one payload to one subscription. Returns 'gone' when the push
// service says the subscription no longer exists (404/410).
async function deliver(sub: SubscriptionRow, payload: OwnerPushPayload): Promise<'ok' | 'gone' | 'error'> {
  const pushSub = { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }
  const options = { TTL: TTL_SECONDS[payload.type], urgency: 'normal' as const, topic: payload.tag.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 32) }
  const body = JSON.stringify(payload)
  try {
    const stub = stubUrl()
    if (stub) {
      // Same encryption + VAPID headers as a real send, delivered to the stub.
      const details = webpush.generateRequestDetails(pushSub, body, options)
      const res = await fetch(stub, {
        method: 'POST',
        headers: { ...(details.headers as Record<string, string>), 'x-push-endpoint': sub.endpoint },
        body: details.body as unknown as BodyInit,
      })
      if (res.status === 404 || res.status === 410) return 'gone'
      return res.ok ? 'ok' : 'error'
    }
    await webpush.sendNotification(pushSub, body, options)
    return 'ok'
  } catch (err) {
    const status = (err as { statusCode?: number }).statusCode
    if (status === 404 || status === 410) return 'gone'
    console.error('owner push: delivery failed', { subscriptionId: sub.id, status, message: (err as Error).message })
    return 'error'
  }
}

export interface SendResult {
  sent: number
  removed: number
  skipped?: 'no-vapid' | 'no-subscriptions' | 'pref-off' | 'throttled'
  previousSentAt?: string | null
}

// Sends `input` to every enabled device of the shop, in the owner's
// language, if the owner hasn't switched that type off and the throttle
// allows it. `beforeClaim` lets a caller (the signups collapse) compute its
// payload from the previous send time returned by the throttle claim.
export async function sendOwnerPush(
  businessId: string,
  input: OwnerPushInput | ((previousSentAt: string | null) => Promise<OwnerPushInput | null>),
  type: OwnerPushType,
  opts: { ignorePrefs?: boolean; onlySubscriptionId?: string } = {},
): Promise<SendResult> {
  if (!ensureVapid() && !stubUrl()) return { sent: 0, removed: 0, skipped: 'no-vapid' }

  let subsQuery = supabaseAdmin
    .from('owner_push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('business_id', businessId)
    .eq('enabled', true)
  if (opts.onlySubscriptionId) subsQuery = subsQuery.eq('id', opts.onlySubscriptionId)

  const [{ data: subs, error: subsErr }, { data: prefs, error: prefsErr }] = await Promise.all([
    subsQuery,
    supabaseAdmin.from('owner_notification_prefs').select('*').eq('business_id', businessId).maybeSingle(),
  ])
  if (subsErr || prefsErr) {
    console.error('owner push: lookup failed', { businessId, type, subsErr, prefsErr })
    return { sent: 0, removed: 0 }
  }
  if (!subs || subs.length === 0) return { sent: 0, removed: 0, skipped: 'no-subscriptions' }
  if (!opts.ignorePrefs && type !== 'test' && prefs && prefs[type as PrefKey] === false) {
    return { sent: 0, removed: 0, skipped: 'pref-off' }
  }

  const limit = PUSH_THROTTLE[type]
  const { data: claim, error: claimErr } = await supabaseAdmin
    .rpc('claim_owner_push_slot', {
      p_business_id: businessId,
      p_type: type,
      p_max: limit.max,
      p_window_seconds: limit.windowSeconds,
    })
    .single<{ claimed: boolean; previous_sent_at: string | null }>()
  if (claimErr || !claim) {
    console.error('owner push: throttle claim failed', { businessId, type, claimErr })
    return { sent: 0, removed: 0 }
  }
  if (!claim.claimed) return { sent: 0, removed: 0, skipped: 'throttled', previousSentAt: claim.previous_sent_at }

  const resolved = typeof input === 'function' ? await input(claim.previous_sent_at) : input
  if (!resolved) return { sent: 0, removed: 0, previousSentAt: claim.previous_sent_at }

  const payload = buildOwnerPushPayload(resolved, prefs?.locale)
  const results = await Promise.all((subs as SubscriptionRow[]).map(async (s) => [s, await deliver(s, payload)] as const))

  const gone = results.filter(([, r]) => r === 'gone').map(([s]) => s.id)
  const ok = results.filter(([, r]) => r === 'ok').map(([s]) => s.id)
  await Promise.all([
    gone.length ? supabaseAdmin.from('owner_push_subscriptions').delete().in('id', gone) : null,
    ok.length ? supabaseAdmin.from('owner_push_subscriptions').update({ last_used_at: new Date().toISOString() }).in('id', ok) : null,
  ])
  return { sent: ok.length, removed: gone.length, previousSentAt: claim.previous_sent_at }
}
