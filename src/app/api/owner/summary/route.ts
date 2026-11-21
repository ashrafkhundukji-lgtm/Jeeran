import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuth } from '@/lib/requestAuth'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

// What the owner app's Home and Offers screens show: the shop, its offers,
// and whether the offer is showing to customers (and why not).
//
// Same owner check as the dashboard page (src/app/dashboard/owner/page.tsx):
// the shop is looked up through the caller's own session client, so RLS
// returns only a shop this user owns. Only after that is proven does the
// admin client read the two service-role-only status functions, for that
// shop id and nothing else.
//
// "Showing / not showing and why" is owner_offer_eligibility()
// (supabase/migrations/20261120_owner_push.sql), whose yes/no is THE shared
// rule (eligible_offers() / shop_is_exposed()); this route does not repeat
// any of the conditions.

const BUSINESS_COLUMNS =
  'id, name, category, ad_credits, is_frozen, is_subscription_active, latitude, longitude, logo_url, phone, whatsapp'
const CAMPAIGN_COLUMNS =
  'id, title, description, bid_per_view, is_active, start_date, end_date, image_url, title_ar, title_en, title_ur, description_ar, description_en, description_ur, created_at, updated_at'

export async function GET(req: NextRequest) {
  const { supabase, user } = await getRequestAuth(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select(BUSINESS_COLUMNS)
    .eq('owner_id', user.id)
    .maybeSingle()
  if (businessError) return NextResponse.json({ error: businessError.message }, { status: 500 })
  if (!business) {
    return NextResponse.json({ error: 'No business found for this account', code: 'no_business' }, { status: 404 })
  }

  const [campaignsRes, eligibilityRes, exposureRes] = await Promise.all([
    supabase
      .from('campaigns')
      .select(CAMPAIGN_COLUMNS)
      .eq('creator_type', 'business')
      .eq('creator_id', business.id)
      .order('created_at', { ascending: false }),
    supabaseAdmin.rpc('owner_offer_eligibility', { p_business_id: business.id }).maybeSingle<{
      eligible: boolean
      reason: string | null
      offer_id: string | null
      offer_title: string | null
    }>(),
    supabaseAdmin.rpc('shop_exposure_status', { p_business_id: business.id }).maybeSingle<{
      exposed: boolean
      in_grace: boolean
      exposure_ends_at: string | null
    }>(),
  ])
  if (campaignsRes.error) return NextResponse.json({ error: campaignsRes.error.message }, { status: 500 })

  const eligibility = eligibilityRes.error ? null : eligibilityRes.data
  const exposure = exposureRes.error ? null : exposureRes.data
  if (eligibilityRes.error) console.error('owner summary: owner_offer_eligibility failed', eligibilityRes.error)
  if (exposureRes.error) console.error('owner summary: shop_exposure_status failed', exposureRes.error)

  return NextResponse.json(
    {
      business,
      campaigns: campaignsRes.data ?? [],
      // null when the check itself failed: the app shows "unknown", never a
      // guessed status.
      offerStatus: eligibility
        ? { showing: Boolean(eligibility.eligible), reason: eligibility.reason, offerId: eligibility.offer_id }
        : null,
      exposure: exposure
        ? { exposed: Boolean(exposure.exposed), inGrace: Boolean(exposure.in_grace), endsAt: exposure.exposure_ends_at }
        : null,
    },
    { headers: { 'Cache-Control': 'private, no-store' } },
  )
}
