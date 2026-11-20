import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { guardOwnerRequest, PREF_KEYS } from '@/lib/push/api'
import { resolvePushLocale } from '@/lib/i18n/ownerPush'

export const dynamic = 'force-dynamic'

const DEFAULTS = { locale: 'ar', redeemed: true, earned: true, signups: true, offer_status: true, trial: true }

// GET: this shop's notification preferences and registered devices.
export async function GET(req: NextRequest) {
  const g = await guardOwnerRequest(req, 'preferences:get', { max: 60, windowSeconds: 600 }, { readBody: false })
  if (!g.ok) return g.response
  const { caller } = g

  const [{ data: prefs, error: prefErr }, { data: devices, error: devErr }] = await Promise.all([
    supabaseAdmin.from('owner_notification_prefs').select('locale, redeemed, earned, signups, offer_status, trial').eq('business_id', caller.businessId).maybeSingle(),
    supabaseAdmin
      .from('owner_push_subscriptions')
      .select('id, endpoint, user_agent_label, created_at, last_used_at')
      .eq('owner_id', caller.userId)
      .eq('business_id', caller.businessId)
      .order('created_at', { ascending: false }),
  ])
  if (prefErr || devErr) return NextResponse.json({ error: (prefErr ?? devErr)!.message }, { status: 500 })
  return NextResponse.json({ prefs: prefs ?? DEFAULTS, devices: devices ?? [] })
}

// PUT: { locale?, redeemed?, earned?, signups?, offer_status?, trial? }
export async function PUT(req: NextRequest) {
  const g = await guardOwnerRequest<Record<string, unknown>>(req, 'preferences:put', { max: 60, windowSeconds: 600 })
  if (!g.ok) return g.response
  const { caller, body } = g

  const update: Record<string, unknown> = {}
  for (const key of PREF_KEYS) {
    if (key in body) {
      if (typeof body[key] !== 'boolean') return NextResponse.json({ error: `${key} must be true or false` }, { status: 400 })
      update[key] = body[key]
    }
  }
  if ('locale' in body) update.locale = resolvePushLocale(body.locale)
  if (Object.keys(update).length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('owner_notification_prefs')
    .upsert({ business_id: caller.businessId, owner_id: caller.userId, ...update, updated_at: new Date().toISOString() }, { onConflict: 'business_id' })
    .select('locale, redeemed, earned, signups, offer_status, trial')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ prefs: data })
}
