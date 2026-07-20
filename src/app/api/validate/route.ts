import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { verifyClaimToken } from '@/lib/wallet/hmac'

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const claimToken: string | undefined = body?.claim
  const hash: string | undefined = body?.hash

  if (!claimToken || !hash) {
    return NextResponse.json({ error: 'Missing claim or hash' }, { status: 400 })
  }
  if (!verifyClaimToken(claimToken, hash)) {
    return NextResponse.json(
      { error: 'This link failed signature verification and may have been tampered with' },
      { status: 400 },
    )
  }

  const { data: claim, error: claimError } = await supabaseAdmin
    .from('scans_and_claims')
    .select('id, is_redeemed, campaigns(id, title, creator_type, creator_id)')
    .eq('claim_token', claimToken)
    .maybeSingle()

  if (claimError) return NextResponse.json({ error: claimError.message }, { status: 500 })
  if (!claim) return NextResponse.json({ error: 'Coupon not found' }, { status: 404 })

  const campaign = Array.isArray(claim.campaigns) ? claim.campaigns[0] : claim.campaigns
  if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })

  // Only the advertiser whose campaign this is may redeem it — the offer
  // gets redeemed at the shop actually giving the discount, not by any
  // logged-in owner who happens to open the link.
  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()
  if (businessError) return NextResponse.json({ error: businessError.message }, { status: 500 })
  const isAuthorized = business?.id === campaign.creator_id

  if (!isAuthorized) {
    return NextResponse.json({ error: 'This coupon does not belong to your business' }, { status: 403 })
  }

  if (claim.is_redeemed) {
    return NextResponse.json({ error: 'This coupon has already been redeemed' }, { status: 409 })
  }

  // Atomic guard (is_redeemed = false in the WHERE) so two simultaneous
  // scans of the same pass can't both succeed.
  const { data: updated, error: updateError } = await supabaseAdmin
    .from('scans_and_claims')
    .update({ is_redeemed: true, redeemed_at: new Date().toISOString() })
    .eq('id', claim.id)
    .eq('is_redeemed', false)
    .select()

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })
  if (!updated || updated.length === 0) {
    return NextResponse.json({ error: 'This coupon has already been redeemed' }, { status: 409 })
  }

  return NextResponse.json({ success: true, title: campaign.title })
}
