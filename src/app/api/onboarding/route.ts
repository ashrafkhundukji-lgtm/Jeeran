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

  // One business per owner (businesses_owner_id_key). An owner who is
  // already onboarded gets a 409 before anything is written — previously
  // this fell through to the insert below and returned Postgres's
  // unique-violation text as a 500, after the profile upsert had already
  // overwritten their name. The page redirects to the dashboard on 409.
  const { data: existing, error: existingError } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()
  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500 })
  if (existing) {
    return NextResponse.json({ error: 'Already onboarded', code: 'already_onboarded' }, { status: 409 })
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
  if (error) {
    // Same constraint hit by a double-submit racing the check above.
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Already onboarded', code: 'already_onboarded' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
