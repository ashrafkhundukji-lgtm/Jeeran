import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const fullName: string = body?.fullName?.trim() || ''
  const businessName: string = body?.businessName?.trim() || ''
  const category: string = body?.category?.trim() || ''
  const latitude = body?.latitude != null && body.latitude !== '' ? Number(body.latitude) : null
  const longitude = body?.longitude != null && body.longitude !== '' ? Number(body.longitude) : null

  if (!fullName) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }
  if (!businessName || !category) {
    return NextResponse.json({ error: 'Business name and category are required' }, { status: 400 })
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({ id: user.id, full_name: fullName, role: 'owner' })

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  const { error } = await supabase.from('businesses').insert({
    owner_id: user.id,
    name: businessName,
    category,
    latitude,
    longitude,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
