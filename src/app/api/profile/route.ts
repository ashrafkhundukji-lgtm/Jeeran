import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function PATCH(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()
  if (businessError) return NextResponse.json({ error: businessError.message }, { status: 500 })
  if (!business) return NextResponse.json({ error: 'No business found for this account' }, { status: 404 })

  const body = await req.json().catch(() => null)
  const fullName: string = body?.fullName?.trim() || ''
  const businessName: string = body?.businessName?.trim() || ''
  const category: string = body?.category?.trim() || ''
  const latitude = body?.latitude != null && body.latitude !== '' ? Number(body.latitude) : null
  const longitude = body?.longitude != null && body.longitude !== '' ? Number(body.longitude) : null
  // Optional contact info shown on the public offer landing page (see
  // supabase/migrations/20260822_business_contact.sql) — both nullable, no
  // format validation here. Stored exactly as typed; whatsapp is sanitized
  // to digits-only at render time (wa.me's requirement), not here, so the
  // form can show back exactly what the shop entered for editing.
  const phone: string | null = body?.phone?.trim() || null
  const whatsapp: string | null = body?.whatsapp?.trim() || null

  if (!fullName) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  if (!businessName || !category) {
    return NextResponse.json({ error: 'Business name and category are required' }, { status: 400 })
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ full_name: fullName })
    .eq('id', user.id)
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })

  const { error } = await supabase
    .from('businesses')
    .update({ name: businessName, category, latitude, longitude, phone, whatsapp })
    .eq('id', business.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
