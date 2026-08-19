import { NextRequest, NextResponse, after } from 'next/server'
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
    .select('id, latitude, longitude, is_frozen')
    .eq('owner_id', user.id)
    .maybeSingle()
  if (businessError) return NextResponse.json({ error: businessError.message }, { status: 500 })
  if (!business) return NextResponse.json({ error: 'No business found for this account' }, { status: 404 })
  if (business.is_frozen) return NextResponse.json({ error: 'This account is frozen' }, { status: 403 })

  const body = await req.json().catch(() => null)
  const title: string = body?.title?.trim() || ''
  const description: string | null = body?.description?.trim() || null
  const bidPerView = Number(body?.bid_per_view)
  const startDate: string | null = body?.start_date?.trim() || null
  const endDate: string | null = body?.end_date?.trim() || null
  // Set via /api/campaigns/upload-image beforehand, not uploaded inline here
  // — the form uploads on file selection and just passes the resulting URL.
  const imageUrl: string | null = body?.image_url?.trim() || null

  if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  if (!Number.isFinite(bidPerView) || bidPerView < 2 || bidPerView > 10) {
    return NextResponse.json({ error: 'bid_per_view must be between 2 and 10' }, { status: 400 })
  }
  if (startDate && endDate && endDate < startDate) {
    return NextResponse.json({ error: 'End date must be on or after the start date' }, { status: 400 })
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
      start_date: startDate,
      end_date: endDate,
      image_url: imageUrl,
      is_active: true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Best-effort geo-push — a campaign is created active by default, so this
  // is also the activation trigger. Never let a push failure fail the
  // campaign creation response. Wrapped in after(): on Vercel, an unawaited
  // promise here isn't guaranteed to run to completion — the runtime can
  // freeze the invocation right after the response is sent. after() extends
  // the invocation's lifetime (via waitUntil under the hood) so this actually
  // finishes instead of silently being cut off. Confirmed live: without
  // after(), an edit's geo-push never landed even minutes later.
  if (business.latitude != null && business.longitude != null) {
    const lat = business.latitude
    const lng = business.longitude
    after(() =>
      notifyMembersNearBusiness(lat, lng).catch((err) => {
        console.error('notifyMembersNearBusiness failed after campaign create', { campaignId: campaign.id, err })
      }),
    )
  }

  return NextResponse.json({ campaign })
}
