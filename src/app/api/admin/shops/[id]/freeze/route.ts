import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdminApi } from '@/lib/adminAuth'
import { logAdminAction } from '@/lib/adminAudit'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Admins only (ADMIN_EMAILS, src/lib/adminAuth.ts): 401 not signed in, 403
// not an admin. Every freeze/unfreeze is recorded in admin_audit_log (who,
// when, reason); the audit row is written first, so a change is never made
// without its record.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminApi()
  if (!admin.ok) return admin.response

  const { id } = await params
  if (!UUID.test(id)) return NextResponse.json({ error: 'Invalid shop id' }, { status: 400 })
  const body = await req.json().catch(() => null)
  if (typeof body?.is_frozen !== 'boolean') {
    return NextResponse.json({ error: 'is_frozen must be a boolean' }, { status: 400 })
  }

  const reason: string | null = body.is_frozen ? String(body.reason ?? '').trim().slice(0, 500) || null : null

  const { data: shop, error: findErr } = await supabaseAdmin.from('businesses').select('id, is_frozen').eq('id', id).maybeSingle()
  if (findErr) return NextResponse.json({ error: findErr.message }, { status: 500 })
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

  try {
    await logAdminAction(admin.user, body.is_frozen ? 'shop.freeze' : 'shop.unfreeze', id, { reason, was_frozen: shop.is_frozen })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Could not record the change; nothing was changed' }, { status: 500 })
  }

  const { error } = await supabaseAdmin
    .from('businesses')
    .update({
      is_frozen: body.is_frozen,
      frozen_reason: reason,
      frozen_at: body.is_frozen ? new Date().toISOString() : null,
    })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
