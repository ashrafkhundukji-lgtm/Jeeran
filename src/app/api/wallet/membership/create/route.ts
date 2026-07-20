/**
 * Membership pass save-flow entry point.
 *
 * Called from the scan-landing page (src/app/scan/[business_id]/page.tsx)
 * when a customer taps "Add to Wallet." Handles both cases:
 *   - First-time visitor (no device_id cookie, or cookie present but no
 *     matching wallet_members row): create the member + Wallet object,
 *     return a save URL.
 *   - Returning member (device_id matches an existing row): DON'T create a
 *     duplicate pass — just hand back the existing save URL.
 *
 * The device_id cookie is set here on first response if missing, so the
 * frontend never has to manage it directly. This is the anonymous-device
 * identity mechanism chosen for MVP (not phone/OTP) — a cleared cookie
 * creates a duplicate pass, an accepted tradeoff for now.
 */

import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createMembershipObject, buildSaveUrl, type NearbyOffer } from '@/lib/wallet/google-membership-pass'

export const dynamic = 'force-dynamic'

const DEVICE_ID_COOKIE = 'jeeran_device_id'
const DEVICE_ID_MAX_AGE = 60 * 60 * 24 * 365 * 2 // 2 years

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

  // Returning member: don't issue a second pass.
  const { data: existing, error: lookupErr } = await supabaseAdmin
    .from('wallet_members')
    .select('id, google_object_id')
    .eq('device_id', deviceId)
    .maybeSingle()

  if (lookupErr) {
    return NextResponse.json({ error: lookupErr.message }, { status: 500 })
  }

  if (existing) {
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
    })
    .select('id')
    .single()

  if (insertErr || !member) {
    return NextResponse.json({ error: insertErr?.message ?? 'failed to create member' }, { status: 500 })
  }

  const { data: initialOffers } = await supabaseAdmin.rpc('nearby_active_offers', {
    p_lat: homeLat,
    p_lng: homeLng,
    p_radius_km: 5,
    p_limit: 5,
  })

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
