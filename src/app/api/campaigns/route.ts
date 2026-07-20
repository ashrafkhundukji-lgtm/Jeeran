import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { hasActiveCampaign } from '@/lib/campaigns'
import { notifyMembersNearBusiness } from '@/lib/wallet/geo-notify'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('id, latitude, longitude')
    .eq('owner_id', user.id)
    .maybeSingle()
  if (businessError) return NextResponse.json({ error: businessError.message }, { status: 500 })
  if (!business) return NextResponse.json({ error: 'No business found for this account' }, { status: 404 })

  const body = await req.json().catch(() => null)
  const title: string = body?.title?.trim() || ''
  const description: string | null = body?.description?.trim() || null
  const bidPerView = Number(body?.bid_per_view)

  if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  if (!Number.isFinite(bidPerView) || bidPerView < 2 || bidPerView > 10) {
    return NextResponse.json({ error: 'bid_per_view must be between 2 and 10' }, { status: 400 })
  }

  if (await hasActiveCampaign(supabase, 'business', business.id)) {
    return NextResponse.json(
      { error: 'You already have an active campaign — deactivate it before creating another.' },
      { status: 409 },
    )
  }

  // RLS ("campaigns: creator full access") enforces that creator_id must
  // resolve to a business owned by this session — using the session client
  // rather than admin means a spoofed creator_id would just fail the insert.
  const { data: campaign, error } = await supabase
    .from('campaigns')
    .insert({
      creator_type: 'business',
      creator_id: business.id,
      title,
      description,
      bid_per_view: bidPerView,
      is_active: true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Best-effort geo-push — a campaign is created active by default, so this
  // is also the activation trigger. Never let a push failure fail the
  // campaign creation response.
  if (business.latitude != null && business.longitude != null) {
    notifyMembersNearBusiness(business.latitude, business.longitude).catch((err) => {
      console.error('notifyMembersNearBusiness failed after campaign create', { campaignId: campaign.id, err })
    })
  }

  return NextResponse.json({ campaign })
}
