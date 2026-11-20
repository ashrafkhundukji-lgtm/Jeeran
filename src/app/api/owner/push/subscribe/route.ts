import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { cleanLabel, guardOwnerRequest, validEndpoint, validKey } from '@/lib/push/api'
import { resolvePushLocale } from '@/lib/i18n/ownerPush'

export const dynamic = 'force-dynamic'

// Registers this phone's push subscription for the signed-in owner's shop.
// Body: { subscription: { endpoint, keys: { p256dh, auth } }, label?, locale? }
export async function POST(req: NextRequest) {
  const g = await guardOwnerRequest<{
    subscription?: { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } }
    label?: unknown
    locale?: unknown
  }>(req, 'subscribe', { max: 20, windowSeconds: 600 })
  if (!g.ok) return g.response
  const { caller, body } = g

  const endpoint = body.subscription?.endpoint
  const p256dh = body.subscription?.keys?.p256dh
  const auth = body.subscription?.keys?.auth
  if (!validEndpoint(endpoint)) return NextResponse.json({ error: 'Invalid push endpoint' }, { status: 400 })
  if (!validKey(p256dh, 16, 200) || !validKey(auth, 8, 100)) {
    return NextResponse.json({ error: 'Invalid subscription keys' }, { status: 400 })
  }

  const { data: existing, error: findErr } = await supabaseAdmin
    .from('owner_push_subscriptions')
    .select('id, owner_id, p256dh, auth')
    .eq('endpoint', endpoint)
    .maybeSingle()
  if (findErr) return NextResponse.json({ error: findErr.message }, { status: 500 })

  // A phone that signed into another owner account earlier holds the same
  // endpoint: the subscription MOVES to this owner and shop (the old owner
  // stops getting pushes on it). The phone proves it holds the subscription
  // by sending the same keys; an endpoint with other keys is someone else's
  // phone and is refused, so nobody can redirect another owner's pushes.
  if (existing && existing.owner_id !== caller.userId && (existing.p256dh !== p256dh || existing.auth !== auth)) {
    return NextResponse.json({ error: 'This subscription belongs to another account' }, { status: 403 })
  }

  const row = {
    owner_id: caller.userId,
    business_id: caller.businessId,
    endpoint,
    p256dh,
    auth,
    enabled: true,
    // Keep the existing label when none is sent (service-worker renewal).
    ...(cleanLabel(body.label) || !existing ? { user_agent_label: cleanLabel(body.label) } : {}),
  }
  // Upsert on the endpoint: one row per phone, never a unique-constraint
  // failure (also covers two taps racing each other).
  const { data: saved, error: saveErr } = await supabaseAdmin
    .from('owner_push_subscriptions')
    .upsert(row, { onConflict: 'endpoint' })
    .select('id')
    .single()
  if (saveErr) return NextResponse.json({ error: saveErr.message }, { status: 500 })

  // Preferences row (defaults: everything on) + the language pushes use.
  // Without a locale (the service worker renewing a rotated subscription)
  // an existing row is left alone.
  const hasLocale = typeof body.locale === 'string'
  const { error: prefErr } = await supabaseAdmin.from('owner_notification_prefs').upsert(
    {
      business_id: caller.businessId,
      owner_id: caller.userId,
      locale: resolvePushLocale(body.locale),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'business_id', ignoreDuplicates: !hasLocale },
  )
  if (prefErr) return NextResponse.json({ error: prefErr.message }, { status: 500 })

  return NextResponse.json({ ok: true, id: saved.id })
}
