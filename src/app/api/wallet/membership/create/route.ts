/**
 * Membership pass save-flow entry point.
 *
 * Called from the scan-landing page (src/app/scan/[business_id]/page.tsx)
 * when a customer taps "Add to Wallet." Handles both cases:
 *   - First-time visitor (no device_id cookie, or cookie present but no
 *     matching wallet_members row): create the member + Wallet object,
 *     return a save URL, and pay the recruiting shop a one-time signup bonus.
 *   - Returning member (device_id matches an existing row): DON'T create a
 *     duplicate pass — just hand back the existing save URL. If they scanned
 *     a DIFFERENT shop than their current origin_business_id, attribution
 *     moves to that shop (last-touch) — see the attribution comment below.
 *     No bonus is paid on this path (see anti-gaming note below).
 *
 * The device_id cookie is set here on first response if missing, so the
 * frontend never has to manage it directly. This is the anonymous-device
 * identity mechanism chosen for MVP (not phone/OTP) — a cleared cookie
 * creates a duplicate pass, an accepted tradeoff for now.
 */

import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createMembershipObject, buildSaveUrl, ensureMembershipClass, type NearbyOffer } from '@/lib/wallet/google-membership-pass'

export const dynamic = 'force-dynamic'

const DEVICE_ID_COOKIE = 'jeeran_device_id'
const DEVICE_ID_MAX_AGE = 60 * 60 * 24 * 365 * 2 // 2 years

// Flat one-time bonus paid to the business that recruits a brand-new member.
// Picked to sit under a typical single-redemption payout (campaigns.bid_per_view
// is constrained 2-10) so it's a meaningful signal without out-earning an
// actual sale. TODO: make admin-configurable.
const SIGNUP_BONUS_CREDITS = 5

// Fraud containment: device_id is just a cookie, so clearing it (or a private
// window) lets the same real person trigger repeat bonuses for a business.
// Rather than adding identity friction (phone/OTP) to a deliberately
// frictionless one-scan flow, cap how many bonuses a single business can
// collect per UTC day — this bounds the blast radius without blocking any
// individual customer's pass creation. TODO: make admin-configurable.
const DAILY_SIGNUP_BONUS_CAP = 20

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const businessId: string | undefined = body?.businessId
  const lat: number | undefined = body?.lat
  const lng: number | undefined = body?.lng

  if (!businessId) {
    return NextResponse.json({ error: 'businessId required' }, { status: 400 })
  }

  let deviceId = req.cookies.get(DEVICE_ID_COOKIE)?.value
  const isNewDevice = !deviceId
  if (!deviceId) deviceId = randomUUID()

  // Fraud-review data only (see DAILY_SIGNUP_BONUS_CAP) — not used to block
  // anything automatically in this pass.
  const signupIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null

  // Returning member: don't issue a second pass.
  const { data: existing, error: lookupErr } = await supabaseAdmin
    .from('wallet_members')
    .select('id, google_object_id, origin_business_id')
    .eq('device_id', deviceId)
    .maybeSingle()

  if (lookupErr) {
    return NextResponse.json({ error: lookupErr.message }, { status: 500 })
  }

  if (existing) {
    // Last-touch attribution: scanning a DIFFERENT shop's stand moves future
    // redemption credit to that shop. A rescan of the same shop is a no-op
    // write. This never pays a signup bonus (see SIGNUP_BONUS_CREDITS above)
    // and never touches home_lat/home_lng — attribution and geo-push
    // targeting are separate concerns.
    if (existing.origin_business_id !== businessId) {
      const { error: reattributeErr } = await supabaseAdmin
        .from('wallet_members')
        .update({ origin_business_id: businessId, last_touch_at: new Date().toISOString() })
        .eq('id', existing.id)
      if (reattributeErr) {
        return NextResponse.json({ error: reattributeErr.message }, { status: 500 })
      }
    }

    await logTouchpoint(existing.id, businessId)

    const res = NextResponse.json({
      alreadyMember: true,
      saveUrl: existing.google_object_id ? await buildSaveUrl(existing.google_object_id) : null,
    })
    setCookieIfNew(res, deviceId, isNewDevice)
    return res
  }

  // First-time member: resolve a home location. Prefer the browser-supplied
  // lat/lng (geolocation permission granted); fall back to the scanned
  // shop's own coordinates if the customer declined the prompt.
  let homeLat = lat
  let homeLng = lng
  if (homeLat == null || homeLng == null) {
    const { data: business, error: bizErr } = await supabaseAdmin
      .from('businesses')
      .select('latitude, longitude')
      .eq('id', businessId)
      .maybeSingle()
    if (bizErr) return NextResponse.json({ error: bizErr.message }, { status: 500 })
    if (!business) return NextResponse.json({ error: 'business not found' }, { status: 404 })
    if (business.latitude == null || business.longitude == null) {
      return NextResponse.json({ error: 'could not resolve a fallback location' }, { status: 400 })
    }
    homeLat = business.latitude
    homeLng = business.longitude
  }

  const { data: member, error: insertErr } = await supabaseAdmin
    .from('wallet_members')
    .insert({
      device_id: deviceId,
      origin_business_id: businessId,
      home_lat: homeLat,
      home_lng: homeLng,
      signup_ip: signupIp,
    })
    .select('id')
    .single()

  if (insertErr || !member) {
    return NextResponse.json({ error: insertErr?.message ?? 'failed to create member' }, { status: 500 })
  }

  await logTouchpoint(member.id, businessId)

  // Signup bonus: paid ONLY on brand-new member creation, never on the
  // re-attribution path above — otherwise a shop could farm repeat bonuses
  // by getting already-registered members to rescan its stand. Don't fail
  // the customer's pass creation over an accounting error; log and let the
  // gap get reconciled separately (mirrors the ad-credit transfer pattern in
  // /api/redeem).
  //
  // Daily cap: device_id is just a cookie, so a business could otherwise
  // collect unlimited bonuses off the same real person clearing cookies /
  // using a private window. Counting today's already-bonused signups for
  // this business bounds that without adding identity friction. If the
  // count check itself fails, skip the bonus this time (fail closed on the
  // fraud-containment side) rather than risk paying past the cap — this
  // never blocks the member row itself from being created.
  const startOfTodayUtc = new Date()
  startOfTodayUtc.setUTCHours(0, 0, 0, 0)

  const { count: todaysBonusCount, error: capCheckErr } = await supabaseAdmin
    .from('wallet_members')
    .select('id', { count: 'exact', head: true })
    .eq('origin_business_id', businessId)
    .eq('signup_bonus_paid', true)
    .gte('created_at', startOfTodayUtc.toISOString())

  if (capCheckErr) {
    console.error('signup bonus cap check failed — skipping bonus', { businessId, memberId: member.id, capCheckErr })
  } else if ((todaysBonusCount ?? 0) >= DAILY_SIGNUP_BONUS_CAP) {
    console.log('signup bonus cap reached — skipping bonus', { businessId, memberId: member.id, todaysBonusCount })
  } else {
    const { error: bonusErr } = await supabaseAdmin.rpc('pay_signup_bonus', {
      p_business_id: businessId,
      p_amount: SIGNUP_BONUS_CREDITS,
    })
    if (bonusErr) {
      console.error('signup bonus payout failed', { businessId, memberId: member.id, bonusErr })
    } else {
      await supabaseAdmin.from('wallet_members').update({ signup_bonus_paid: true }).eq('id', member.id)
    }
  }

  const { data: initialOffers } = await supabaseAdmin.rpc('nearby_active_offers', {
    p_lat: homeLat,
    p_lng: homeLng,
    p_radius_km: 5,
    p_limit: 5,
  })

  // Idempotent (GET-then-create) — cheap to call on every first-time
  // registration rather than requiring a separate one-time deploy step that
  // was never actually wired up anywhere.
  await ensureMembershipClass()

  const objectId = await createMembershipObject(member.id, (initialOffers ?? []) as NearbyOffer[])

  // Set immediately — object creation via the REST API already succeeded,
  // we don't need to wait for the save-event callback to know it exists.
  // The callback route remains the source of truth for DELETE events.
  await supabaseAdmin.from('wallet_members').update({ google_object_id: objectId }).eq('id', member.id)

  const saveUrl = await buildSaveUrl(objectId)

  const res = NextResponse.json({ alreadyMember: false, saveUrl })
  setCookieIfNew(res, deviceId, isNewDevice)
  return res
}

// Every scan event, regardless of whether it changes attribution — first
// touch, re-attribution, or a repeat scan of the same shop. Not read by any
// code yet; raw material for future customer-migration analytics. Non-fatal:
// don't block the customer's pass save/reuse over a logging failure.
async function logTouchpoint(memberId: string, businessId: string) {
  const { error } = await supabaseAdmin
    .from('wallet_member_touchpoints')
    .insert({ member_id: memberId, business_id: businessId })
  if (error) {
    console.error('touchpoint log failed', { memberId, businessId, error })
  }
}

function setCookieIfNew(res: NextResponse, deviceId: string, isNew: boolean) {
  if (!isNew) return
  res.cookies.set(DEVICE_ID_COOKIE, deviceId, {
    maxAge: DEVICE_ID_MAX_AGE,
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
  })
}
