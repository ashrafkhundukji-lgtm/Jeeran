import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { guardOwnerRequest, validEndpoint } from '@/lib/push/api'
import { sendOwnerPush } from '@/lib/push/send'

export const dynamic = 'force-dynamic'

// Sends a test notification to this phone ({ endpoint }) or, without an
// endpoint, to every device of the signed-in owner's shop. Awaited (not
// after()) so the page can say whether it went out.
export async function POST(req: NextRequest) {
  const g = await guardOwnerRequest<{ endpoint?: unknown }>(req, 'test', { max: 5, windowSeconds: 600 })
  if (!g.ok) return g.response
  const { caller, body } = g

  let onlySubscriptionId: string | undefined
  if (body.endpoint !== undefined) {
    if (!validEndpoint(body.endpoint)) return NextResponse.json({ error: 'Invalid push endpoint' }, { status: 400 })
    const { data: row, error } = await supabaseAdmin
      .from('owner_push_subscriptions')
      .select('id, owner_id')
      .eq('endpoint', body.endpoint)
      .maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!row) return NextResponse.json({ error: 'This phone is not registered' }, { status: 404 })
    if (row.owner_id !== caller.userId) return NextResponse.json({ error: 'Not your device' }, { status: 403 })
    onlySubscriptionId = row.id
  }

  const result = await sendOwnerPush(caller.businessId, { type: 'test' }, 'test', { ignorePrefs: true, onlySubscriptionId })
  if (result.skipped === 'no-vapid') return NextResponse.json({ error: 'Push is not configured on the server' }, { status: 501 })
  if (result.skipped === 'throttled') return NextResponse.json({ error: 'Too many tests, try again later' }, { status: 429 })
  if (result.skipped === 'no-subscriptions') return NextResponse.json({ error: 'No registered device' }, { status: 404 })
  return NextResponse.json({ ok: result.sent > 0, sent: result.sent, removed: result.removed })
}
