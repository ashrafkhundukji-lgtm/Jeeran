import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// No auth gate here — matches the admin overview page's current posture
// ("no login required yet, do not expose this URL publicly"). Lock this
// down alongside that page when admin auth is added.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json().catch(() => null)
  if (typeof body?.is_frozen !== 'boolean') {
    return NextResponse.json({ error: 'is_frozen must be a boolean' }, { status: 400 })
  }

  const reason: string | null = body.is_frozen ? body.reason?.trim() || null : null

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
