import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { guardOwnerRequest, validEndpoint } from '@/lib/push/api'

export const dynamic = 'force-dynamic'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Turns a device off: deletes its subscription. Body: { endpoint } (this
// phone) or { id } (a device listed on the settings page).
export async function POST(req: NextRequest) {
  const g = await guardOwnerRequest<{ endpoint?: unknown; id?: unknown }>(req, 'unsubscribe', { max: 30, windowSeconds: 600 })
  if (!g.ok) return g.response
  const { caller, body } = g

  let query = supabaseAdmin.from('owner_push_subscriptions').select('id, owner_id')
  if (typeof body.id === 'string' && UUID.test(body.id)) query = query.eq('id', body.id)
  else if (validEndpoint(body.endpoint)) query = query.eq('endpoint', body.endpoint)
  else return NextResponse.json({ error: 'Give a valid endpoint or id' }, { status: 400 })

  const { data: row, error } = await query.maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!row) return NextResponse.json({ ok: true, removed: 0 })
  if (row.owner_id !== caller.userId) return NextResponse.json({ error: 'Not your device' }, { status: 403 })

  const { error: delErr } = await supabaseAdmin.from('owner_push_subscriptions').delete().eq('id', row.id)
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })
  return NextResponse.json({ ok: true, removed: 1 })
}
