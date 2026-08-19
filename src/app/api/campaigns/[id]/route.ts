import { NextRequest, NextResponse, after } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { hasActiveCampaign } from '@/lib/campaigns'
import { notifyMembersNearBusiness } from '@/lib/wallet/geo-notify'

async function handleToggle(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  id: string,
  isActive: boolean,
) {
  if (isActive) {
    const { data: campaign, error: fetchError } = await supabase
      .from('campaigns')
      .select('creator_type, creator_id')
      .eq('id', id)
      .maybeSingle()
    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })
    if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })

    if (await hasActiveCampaign(supabase, campaign.creator_type, campaign.creator_id, id)) {
      return NextResponse.json(
        { error: 'You already have another active campaign — deactivate it first.' },
        { status: 409 },
      )
    }

    if (campaign.creator_type === 'business') {
      const { data: creatorBusiness } = await supabase
        .from('businesses')
        .select('is_frozen')
        .eq('id', campaign.creator_id)
        .maybeSingle()
      if (creatorBusiness?.is_frozen) {
        return NextResponse.json({ error: 'This account is frozen' }, { status: 403 })
      }
    }
  }

  // RLS silently filters rows the caller doesn't own rather than erroring,
  // so a 0-row update result has to be treated as "not found/forbidden"
  // explicitly, or an unauthorized PATCH would report success.
  const { data, error } = await supabase
    .from('campaigns')
    .update({ is_active: isActive })
    .eq('id', id)
    .select('id, creator_type, creator_id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  }

  // Geo-push trigger — business-only for MVP (technician campaigns aren't
  // geo-targeted yet; nearby_active_offers() excludes them on purpose).
  // Fires on BOTH activation and deactivation: nearby_active_offers() only
  // returns is_active=true campaigns, so a deactivation needs the same
  // refresh to drop the now-inactive offer from members' cards promptly —
  // otherwise it just sits there until an unrelated nearby activation
  // happens to overwrite it. Best-effort: never let a push failure fail the
  // toggle response. Wrapped in after() — see the campaign-create route for
  // why an unawaited promise alone isn't safe on Vercel.
  const updated = data[0]
  if (updated.creator_type === 'business') {
    const { data: toggledBusiness } = await supabase
      .from('businesses')
      .select('latitude, longitude')
      .eq('id', updated.creator_id)
      .maybeSingle()

    if (toggledBusiness?.latitude != null && toggledBusiness?.longitude != null) {
      const lat = toggledBusiness.latitude
      const lng = toggledBusiness.longitude
      after(() =>
        notifyMembersNearBusiness(lat, lng).catch((err) => {
          console.error('notifyMembersNearBusiness failed after campaign toggle', { campaignId: id, isActive, err })
        }),
      )
    }
  }

  return NextResponse.json({ success: true })
}

async function handleEdit(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  id: string,
  body: {
    title?: string
    description?: string | null
    bid_per_view?: number
    start_date?: string | null
    end_date?: string | null
    image_url?: string | null
  },
) {
  const title = body.title?.trim() || ''
  const description = body.description?.trim() || null
  const bidPerView = Number(body.bid_per_view)
  const startDate = body.start_date?.trim() || null
  const endDate = body.end_date?.trim() || null
  const imageUrl = body.image_url?.trim() || null

  if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  if (!Number.isFinite(bidPerView) || bidPerView < 2 || bidPerView > 10) {
    return NextResponse.json({ error: 'bid_per_view must be between 2 and 10' }, { status: 400 })
  }
  if (startDate && endDate && endDate < startDate) {
    return NextResponse.json({ error: 'End date must be on or after the start date' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('campaigns')
    .update({ title, description, bid_per_view: bidPerView, start_date: startDate, end_date: endDate, image_url: imageUrl })
    .eq('id', id)
    .select('id, is_active, creator_type, creator_id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  }

  // Same geo-push trigger as handleToggle, same reason: a title/bid/date
  // edit can change what nearby_active_offers() ranks (bid affects order,
  // dates affect whether it's in-window) just as much as an activate does.
  // Only fires for an already-active campaign — an edit to an inactive one
  // isn't visible to anyone via nearby_active_offers() regardless, so
  // there's nothing to push. Best-effort, same as handleToggle. Wrapped in
  // after() — see the campaign-create route for why an unawaited promise
  // alone isn't safe on Vercel.
  const updated = data[0]
  if (updated.is_active && updated.creator_type === 'business') {
    const { data: editedBusiness } = await supabase
      .from('businesses')
      .select('latitude, longitude')
      .eq('id', updated.creator_id)
      .maybeSingle()

    if (editedBusiness?.latitude != null && editedBusiness?.longitude != null) {
      const lat = editedBusiness.latitude
      const lng = editedBusiness.longitude
      after(() =>
        notifyMembersNearBusiness(lat, lng).catch((err) => {
          console.error('notifyMembersNearBusiness failed after campaign edit', { campaignId: id, err })
        }),
      )
    }
  }

  return NextResponse.json({ success: true })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if ('title' in body) return handleEdit(supabase, id, body)
  if (typeof body.is_active === 'boolean') return handleToggle(supabase, id, body.is_active)

  return NextResponse.json({ error: 'is_active must be a boolean' }, { status: 400 })
}
