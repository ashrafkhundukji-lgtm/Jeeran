/**
 * Redemption endpoint — called from the shop staff-facing scan UI.
 *
 * Flow: staff scans the customer's membership-pass barcode -> this decodes
 * the member token -> checks whether that member currently qualifies for
 * an ACTIVE, UNREDEEMED offer from the scanning shop's own business ->
 * logs the redemption (blocks re-claiming the same offer) -> returns the
 * offer details for staff to honor.
 *
 * One active campaign per business is a real DB constraint today
 * (campaigns_one_active_per_creator), not a scaffold assumption — see
 * src/lib/campaigns.ts.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthenticatedBusinessId } from '@/lib/business-auth'
import { verifyMemberToken } from '@/lib/wallet/member-token'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const businessId = await getAuthenticatedBusinessId()
  if (!businessId) {
    return NextResponse.json({ error: 'not authenticated as a business' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const barcodeValue: string | undefined = body?.barcodeValue

  if (!barcodeValue) {
    return NextResponse.json({ error: 'barcodeValue is required' }, { status: 400 })
  }

  const decoded = verifyMemberToken(barcodeValue)
  if (!decoded) {
    return NextResponse.json({ error: 'invalid or tampered barcode' }, { status: 400 })
  }

  // Does this business currently have an active offer this member hasn't
  // already redeemed?
  const { data: offer, error: offerErr } = await supabaseAdmin
    .from('campaigns')
    .select('id, title, description')
    .eq('creator_type', 'business')
    .eq('creator_id', businessId)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  if (offerErr) {
    return NextResponse.json({ error: offerErr.message }, { status: 500 })
  }
  if (!offer) {
    return NextResponse.json({ error: 'no active offer for this shop' }, { status: 404 })
  }

  const { data: existing, error: alreadyErr } = await supabaseAdmin
    .from('redemptions')
    .select('id')
    .eq('member_id', decoded.memberId)
    .eq('offer_id', offer.id)
    .maybeSingle()

  if (alreadyErr) {
    return NextResponse.json({ error: alreadyErr.message }, { status: 500 })
  }
  if (existing) {
    return NextResponse.json({ error: 'already redeemed by this customer' }, { status: 409 })
  }

  const { error: insertErr } = await supabaseAdmin.from('redemptions').insert({
    member_id: decoded.memberId,
    business_id: businessId,
    offer_id: offer.id,
  })

  if (insertErr) {
    // Unique constraint (member_id, offer_id) double-guards against a race
    // between two staff scans of the same customer at the same moment.
    if (insertErr.code === '23505') {
      return NextResponse.json({ error: 'already redeemed by this customer' }, { status: 409 })
    }
    return NextResponse.json({ error: insertErr.message }, { status: 500 })
  }

  // Ad-credit transfer: the shop that recruited this member
  // (wallet_members.origin_business_id) earns credit on this redemption.
  // Don't fail the customer's redemption over an accounting error — log
  // and let the credit gap get reconciled/alerted separately.
  const { error: creditErr } = await supabaseAdmin.rpc('claim_ad_credit_transaction_membership', {
    p_member_id: decoded.memberId,
    p_offer_id: offer.id,
    p_redeeming_business_id: businessId,
  })
  if (creditErr) {
    console.error('ad-credit transfer failed for redemption', {
      memberId: decoded.memberId,
      offerId: offer.id,
      creditErr,
    })
  }

  return NextResponse.json({
    ok: true,
    offer: { id: offer.id, title: offer.title, description: offer.description },
  })
}
