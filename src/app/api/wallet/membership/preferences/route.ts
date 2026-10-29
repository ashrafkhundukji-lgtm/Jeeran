/**
 * Lets an end customer change the radius their offers are drawn from
 * (wallet_members.push_radius_km) and/or update their saved location
 * (home_lat/home_lng), from the settings section on /wallet/home and the
 * "widen to X km" buttons on the empty states.
 *
 * Identifies the member with the same signed token every wallet page and
 * the language route use (verifyMemberToken) — not a raw memberId — so a
 * guessed uuid can't change a stranger's settings.
 *
 * Location is only ever written from coordinates the browser just
 * returned; a denied or timed-out geolocation request never reaches this
 * route, so it can't overwrite a stored location (same rule as the scan
 * flow in membership/create/route.ts).
 *
 * After saving, the Wallet card is re-patched with refreshMember() — the
 * same call the language route and the scan flow's location refresh use —
 * and the response says whether that worked. The preference is saved
 * either way; a failed card update is caught by the next refresh (any
 * offer change nearby, or the daily sweep).
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verifyMemberToken } from '@/lib/wallet/member-token'
import { refreshMember } from '@/lib/wallet/geo-notify'
import { isAllowedRadius } from '@/lib/wallet/radius'

export const dynamic = 'force-dynamic'

// Per member: plenty for someone trying a few radii or re-locating, far
// below anything that would hammer the Wallet API.
const MAX_CHANGES = 20
const WINDOW_MINUTES = 60

function isLat(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v >= -90 && v <= 90
}
function isLng(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v >= -180 && v <= 180
}
const roundCoord = (v: number) => Math.round(v * 1000) / 1000

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const token: unknown = body?.token
  if (typeof token !== 'string' || !token) return NextResponse.json({ error: 'token required' }, { status: 400 })

  const { radiusKm, lat, lng } = body as { radiusKm?: unknown; lat?: unknown; lng?: unknown }
  const hasRadius = radiusKm !== undefined
  const hasLocation = lat !== undefined || lng !== undefined
  if (!hasRadius && !hasLocation) return NextResponse.json({ error: 'nothing to change' }, { status: 400 })
  if (hasRadius && !isAllowedRadius(radiusKm)) return NextResponse.json({ error: 'invalid radius' }, { status: 400 })
  if (hasLocation && !(isLat(lat) && isLng(lng))) return NextResponse.json({ error: 'invalid location' }, { status: 400 })

  const decoded = verifyMemberToken(token)
  if (!decoded) return NextResponse.json({ error: 'invalid token' }, { status: 401 })

  const { data: member, error } = await supabaseAdmin
    .from('wallet_members')
    .select('id, google_object_id, home_lat, home_lng, push_radius_km, last_notified_offers, preferred_language')
    .eq('id', decoded.memberId)
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!member) return NextResponse.json({ error: 'member not found' }, { status: 404 })

  const { data: allowed, error: limitError } = await supabaseAdmin.rpc('claim_member_pref_change', {
    p_member_id: member.id,
    p_kind: hasRadius && hasLocation ? 'both' : hasRadius ? 'radius' : 'location',
    p_max: MAX_CHANGES,
    p_window_minutes: WINDOW_MINUTES,
  })
  if (limitError) return NextResponse.json({ error: limitError.message }, { status: 500 })
  if (!allowed) return NextResponse.json({ error: 'too many changes' }, { status: 429 })

  const update: { push_radius_km?: number; home_lat?: number; home_lng?: number } = {}
  if (hasRadius) update.push_radius_km = radiusKm as number
  if (hasLocation) {
    // Stored to 3 decimals (about 100 m) — enough for "offers within X km",
    // and what the privacy line on the settings section promises.
    update.home_lat = roundCoord(lat as number)
    update.home_lng = roundCoord(lng as number)
  }
  const { error: updateErr } = await supabaseAdmin.from('wallet_members').update(update).eq('id', member.id)
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  // Awaited (not after()) so the page can tell the customer whether the card
  // already shows the change. force: true — a location change can move only
  // the "X km" texts while the offer set stays the same.
  let cardUpdated: boolean | null = null
  if (member.google_object_id) {
    try {
      await refreshMember(
        {
          id: member.id,
          google_object_id: member.google_object_id,
          home_lat: update.home_lat ?? member.home_lat,
          home_lng: update.home_lng ?? member.home_lng,
          push_radius_km: update.push_radius_km ?? member.push_radius_km,
          last_notified_offers: member.last_notified_offers ?? {},
          preferred_language: member.preferred_language,
        },
        { force: true },
      )
      cardUpdated = true
    } catch (err) {
      console.error('preferences: card refresh failed', { memberId: member.id, err })
      cardUpdated = false
    }
  }

  return NextResponse.json({ ok: true, radiusKm: update.push_radius_km ?? member.push_radius_km, cardUpdated })
}
