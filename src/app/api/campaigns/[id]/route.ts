import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { hasActiveCampaign } from '@/lib/campaigns'
import { notifyMembersNearBusiness } from '@/lib/wallet/geo-notify'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (typeof body?.is_active !== 'boolean') {
    return NextResponse.json({ error: 'is_active must be a boolean' }, { status: 400 })
  }

  if (body.is_active) {
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
  }

  // RLS silently filters rows the caller doesn't own rather than erroring,
  // so a 0-row update result has to be treated as "not found/forbidden"
  // explicitly, or an unauthorized PATCH would report success.
  const { data, error } = await supabase
    .from('campaigns')
    .update({ is_active: body.is_active })
    .eq('id', id)
    .select('id, creator_type, creator_id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  }

  // Geo-push trigger — business-only for MVP (technician campaigns aren't
  // geo-targeted yet; nearby_active_offers() excludes them on purpose).
  // Best-effort: never let a push failure fail the toggle response.
  const updated = data[0]
  if (body.is_active && updated.creator_type === 'business') {
    const { data: activatedBusiness } = await supabase
      .from('businesses')
      .select('latitude, longitude')
      .eq('id', updated.creator_id)
      .maybeSingle()

    if (activatedBusiness?.latitude != null && activatedBusiness?.longitude != null) {
      notifyMembersNearBusiness(activatedBusiness.latitude, activatedBusiness.longitude).catch((err) => {
        console.error('notifyMembersNearBusiness failed after campaign activation', { campaignId: id, err })
      })
    }
  }

  return NextResponse.json({ success: true })
}
