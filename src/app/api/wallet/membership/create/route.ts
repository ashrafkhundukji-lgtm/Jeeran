/**
 * Membership pass save-flow entry point.
 *
 * Called from the scan-landing page (src/app/scan/[business_id]/page.tsx)
 * when a customer taps "Add to Wallet." Handles both cases:
 *   - First-time visitor (no device_id cookie, or cookie present but no
 *     matching wallet_members row): create the member + Wallet object,
 *     return a save URL, and pay the recruiting shop a one-time signup bonus.
 *   - Returning member (device_id matches an existing row): DON'T create a
 *     duplicate pass — just hand back the existing save URL. origin_business_id
 *     is PERMANENT (first-touch-forever, reversed back from the last-touch
 *     model — see 20260818b_rescan_credit_dual_award.sql) — scanning a
 *     different shop's stand never moves it. Instead, every scan by an
 *     existing member fires the rescan-credit mechanic (see
 *     recordRescanTouchpoint) — a third, distinct credit event from the
 *     signup bonus below and redemption credit.
 *
 * The device_id cookie is set here on first response if missing, so the
 * frontend never has to manage it directly. This is the anonymous-device
 * identity mechanism chosen for MVP (not phone/OTP) — a cleared cookie
 * creates a duplicate pass, an accepted tradeoff for now.
 */

import { NextRequest, NextResponse, after } from 'next/server'
import { randomUUID } from 'node:crypto'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createMembershipObject, buildSaveUrl, ensureMembershipClass, type NearbyOffer } from '@/lib/wallet/google-membership-pass'
import { recordRescanTouchpoint } from '@/lib/wallet/rescan-credit'
import { refreshMember } from '@/lib/wallet/geo-notify'

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

  // Fraud-review data only (see DAILY_SIGNUP_BONUS_CAP / rescan-credit's own
  // cap) — not used to block anything automatically in this pass.
  const requestIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null

  // Returning member: don't issue a second pass.
  const { data: existing, error: lookupErr } = await supabaseAdmin
    .from('wallet_members')
    .select('id, google_object_id, origin_business_id, home_lat, home_lng, push_radius_km, last_notified_offers')
    .eq('device_id', deviceId)
    .maybeSingle()

  if (lookupErr) {
    return NextResponse.json({ error: lookupErr.message }, { status: 500 })
  }

  if (existing) {
    // origin_business_id is permanent — never updated here. Every scan by
    // an existing member (same shop or a different one) logs a touchpoint
    // and, subject to its own 24h-per-pair cooldown and daily per-business
    // cap, fires the rescan-credit mechanic: RESCAN_CREDIT to the scanned
    // business, ORIGIN_RESCAN_CREDIT to the permanent origin business (both,
    // independently, when they're the same business). This never pays the
    // signup bonus below — that's brand-new-member-only.
    await recordRescanTouchpoint({
      memberId: existing.id,
      originBusinessId: existing.origin_business_id,
      scannedBusinessId: businessId,
      ip: requestIp,
    })

    // Re-engagement location refresh: home_lat/home_lng is frozen at signup
    // by design (see the column comment in
    // supabase/migrations/20260817_nearby_offers_locations.sql) — that's
    // fine for the OS-level geofencing merchantLocations drives, but it
    // means the "X km" distance text baked into the card (offersToTextModules)
    // never updates either, which a real customer flagged as confusing after
    // moving 10km. The scan page already re-requests geolocation on every
    // visit via getBrowserLocation() (AddToWalletMembershipButton.tsx) and
    // sends it in this same request body — previously it was read only for
    // first-time signup and silently discarded here for returning members.
    // Only overwrite on an actual grant: a declined/timed-out prompt
    // resolves to undefined client-side, and must never clobber a location
    // already on file.
    let homeLat = existing.home_lat
    let homeLng = existing.home_lng
    let locationRefreshed = false
    if (lat != null && lng != null) {
      homeLat = lat
      homeLng = lng
      locationRefreshed = true
      const { error: locErr } = await supabaseAdmin
        .from('wallet_members')
        .update({ home_lat: lat, home_lng: lng })
        .eq('id', existing.id)
      if (locErr) console.error('home location refresh failed', { memberId: existing.id, locErr })
    }

    // A row can have google_object_id = null when a PREVIOUS visit created
    // the member but never got as far as creating the Google Wallet object
    // (e.g. the GOOGLE_WALLET_SERVICE_ACCOUNT_KEY_B64 outage on 2026-08-15).
    // That's a fixable, one-time gap — retry object creation now rather than
    // permanently handing back saveUrl: null for a row nothing will ever
    // repair on its own. Caught separately from the rest of the handler so a
    // still-broken credential degrades to the pre-existing null-saveUrl
    // response instead of a 500, and doesn't block re-attribution above.
    // Uses homeLat/homeLng (not existing.home_lat/lng) so a just-granted
    // fresh location seeds the object instead of the stale signup-time one.
    let objectId = existing.google_object_id
    if (!objectId && homeLat != null && homeLng != null) {
      try {
        objectId = await createAndStoreMembershipObject(existing.id, homeLat, homeLng)
      } catch (err) {
        console.error('retry: createMembershipObject failed for existing member', { memberId: existing.id, err })
      }
    } else if (objectId && locationRefreshed) {
      // Object already exists — push the corrected distances to it right
      // now rather than waiting for the next business-triggered event or the
      // periodic cron sweep (up to 24h away), which is exactly the gap that
      // left a real customer looking at a stale "X km" for days. Reuses
      // geo-notify's own refreshMember() (card patch + last_notified_offers/
      // offer_notifications bookkeeping) instead of re-deriving that here —
      // force: true because the offer SET may be unchanged while only
      // distance has moved (see refreshMember()'s own comment on that flag).
      // Best-effort, wrapped in after(): an unawaited promise alone isn't
      // guaranteed to run to completion on Vercel — same reasoning as the
      // campaign routes' geo-push calls.
      const refreshHomeLat = homeLat
      const refreshHomeLng = homeLng
      after(() =>
        refreshMember(
          {
            id: existing.id,
            google_object_id: objectId!,
            home_lat: refreshHomeLat,
            home_lng: refreshHomeLng,
            push_radius_km: existing.push_radius_km,
            last_notified_offers: existing.last_notified_offers ?? {},
          },
          { force: true },
        ).catch((err) => {
          console.error('post-scan location refresh failed', { memberId: existing.id, err })
        }),
      )
    }

    const res = NextResponse.json({
      alreadyMember: true,
      saveUrl: objectId ? await buildSaveUrl(objectId) : null,
    })
    setCookieIfNew(res, deviceId, isNewDevice)
    return res
  }

  // First-time member: resolve a home location. Prefer the browser-supplied
  // lat/lng (geolocation permission granted); fall back to the scanned
  // shop's own coordinates if the customer declined the prompt. This is a
  // one-time seed, not a live-tracked position — see the wallet_members.
  // home_lat column comment (supabase/migrations/20260817_nearby_offers_locations.sql)
  // for what it does and doesn't drive now that the Wallet object's own
  // `locations` field handles ongoing "follows the customer" relevance.
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

  // Unreachable in practice — every path above either keeps the caller's
  // lat/lng or fills both from the business, else returns early. Narrows
  // homeLat/homeLng from `number | undefined` to `number` for TypeScript so
  // createAndStoreMembershipObject below doesn't need a second null check.
  if (homeLat == null || homeLng == null) {
    return NextResponse.json({ error: 'could not resolve a home location' }, { status: 500 })
  }

  const { data: member, error: insertErr } = await supabaseAdmin
    .from('wallet_members')
    .insert({
      device_id: deviceId,
      origin_business_id: businessId,
      home_lat: homeLat,
      home_lng: homeLng,
      signup_ip: requestIp,
    })
    .select('id')
    .single()

  if (insertErr || !member) {
    return NextResponse.json({ error: insertErr?.message ?? 'failed to create member' }, { status: 500 })
  }

  await logTouchpoint(member.id, businessId, requestIp)

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

  const objectId = await createAndStoreMembershipObject(member.id, homeLat, homeLng)

  const saveUrl = await buildSaveUrl(objectId)

  const res = NextResponse.json({ alreadyMember: false, saveUrl })
  setCookieIfNew(res, deviceId, isNewDevice)
  return res
}

// Shared by the first-time-member path and the returning-member retry path
// (see the null google_object_id branch above) so the two can't drift.
// Throws on failure — callers decide whether that should surface as a 500
// (first-time signup) or degrade to saveUrl: null (retry on an existing row).
async function createAndStoreMembershipObject(memberId: string, homeLat: number, homeLng: number): Promise<string> {
  const { data: initialOffers } = await supabaseAdmin.rpc('nearby_active_offers', {
    p_lat: homeLat,
    p_lng: homeLng,
    p_radius_km: 5,
    p_limit: 5,
  })

  // Idempotent (GET-then-create) — cheap to call on every attempt rather
  // than requiring a separate one-time deploy step that was never actually
  // wired up anywhere.
  await ensureMembershipClass()

  const objectId = await createMembershipObject(memberId, (initialOffers ?? []) as NearbyOffer[])

  // Set immediately — object creation via the REST API already succeeded,
  // we don't need to wait for the save-event callback to know it exists.
  // The callback route remains the source of truth for DELETE events.
  await supabaseAdmin.from('wallet_members').update({ google_object_id: objectId }).eq('id', memberId)

  return objectId
}

// First-touch-only logging — the very first touchpoint row for a brand-new
// member. (Existing members' every-scan logging, including credit-award
// logic, lives in recordRescanTouchpoint instead — see rescan-credit.ts.)
// Non-fatal: don't block the customer's pass save/reuse over a logging
// failure.
async function logTouchpoint(memberId: string, businessId: string, ip: string | null) {
  const { error } = await supabaseAdmin
    .from('wallet_member_touchpoints')
    .insert({ member_id: memberId, business_id: businessId, scan_ip: ip })
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
