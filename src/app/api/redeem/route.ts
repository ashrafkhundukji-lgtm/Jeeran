/**
 * Redemption endpoint — called from the shop staff-facing scan UI.
 *
 * Flow: staff scans the customer's membership-pass barcode -> this decodes
 * the member token -> confirms the pass hasn't been removed from the
 * customer's wallet (google_object_id still set) -> checks whether that
 * member currently qualifies for an ACTIVE, UNREDEEMED offer from the
 * scanning shop's own business -> logs the redemption (blocks re-claiming
 * the same offer) -> returns the offer details for staff to honor.
 *
 * The google_object_id check exists because a screenshotted/copied barcode
 * decodes fine on its own — without it, a customer could delete the pass
 * and keep redeeming offers from a screenshot, defeating the "keep the pass
 * saved" retention design. google_object_id is nulled by the Google Wallet
 * callback's delete event (src/app/api/wallet/google/callback/route.ts),
 * which requires a genuinely Google-signed JWT and is not forgeable
 * locally — see docs/test-plan.md UC-F6/F7.
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

  // Retention gate: a screenshotted/copied barcode still decodes fine even
  // after the customer removes the pass from their wallet, which would let
  // them keep redeeming offers with no pass installed — defeating the whole
  // point of gating offers behind "keep the pass saved." google_object_id is
  // set null by the Google Wallet callback's delete event (see
  // src/app/api/wallet/google/callback/route.ts), so a null here means the
  // pass is gone and this barcode should stop working.
  const { data: member, error: memberErr } = await supabaseAdmin
    .from('wallet_members')
    .select('google_object_id')
    .eq('id', decoded.memberId)
    .maybeSingle()

  if (memberErr) {
    return NextResponse.json({ error: memberErr.message }, { status: 500 })
  }
  if (!member || !member.google_object_id) {
    return NextResponse.json({ error: 'pass no longer active' }, { status: 410 })
  }

  const { data: redeemingBusiness } = await supabaseAdmin
    .from('businesses')
    .select('is_frozen')
    .eq('id', businessId)
    .maybeSingle()
  if (redeemingBusiness?.is_frozen) {
    return NextResponse.json({ error: 'This account is frozen' }, { status: 403 })
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

  // Promotion-tier milestone bonus (Phase 4, item 9): this business's score
  // is total redemptions earned as an advertiser — the redemptions row just
  // inserted above is exactly a score-driving event, so this is where a
  // tier crossing would happen. check_and_award_milestone_bonus() is
  // idempotent (guarded by businesses.last_milestone_tier, same role
  // wallet_members.signup_bonus_paid plays for the signup bonus) and
  // race-safe (FOR UPDATE-locks the business row), so calling it here on
  // every redemption is cheap and safe even though most calls find nothing
  // to award. Best-effort, same as the ad-credit transfer above — a failed
  // check shouldn't fail the customer's redemption.
  const { error: milestoneErr } = await supabaseAdmin.rpc('check_and_award_milestone_bonus', {
    p_business_id: businessId,
  })
  if (milestoneErr) {
    console.error('milestone bonus check failed', { businessId, milestoneErr })
  }

  return NextResponse.json({
    ok: true,
    offer: { id: offer.id, title: offer.title, description: offer.description },
  })
}
