/**
 * Geo-notify: refreshes each wallet_members' saved pass with whatever
 * offers are currently active near their home_lat/home_lng.
 *
 * Two ways to trigger this:
 *  1. Event-driven — call notifyMembersNearBusiness() right when a campaign
 *     goes live (wired into src/app/api/campaigns/route.ts and
 *     src/app/api/campaigns/[id]/route.ts).
 *  2. Periodic sweep — call refreshAllMembers() on a schedule (Supabase
 *     Edge Function cron, or a Vercel cron hitting an API route) e.g. every
 *     6 hours, to catch offers that changed bid/expired since last push.
 *
 * Both call the same per-member patch, so start with (1) — it's cheaper —
 * and add (2) once you see how often (1) alone leaves members stale.
 */

import { supabaseAdmin } from '@/lib/supabase-admin'
import { patchMembershipObject, type NearbyOffer } from './google-membership-pass'

interface WalletMember {
  id: string
  google_object_id: string | null
  home_lat: number
  home_lng: number
  push_radius_km: number
  last_notified_offer_ids: string[]
}

/**
 * Call this when a new/updated campaign goes live at `businessLat/Lng`.
 * Finds members within a generous catchment radius and refreshes only
 * the ones whose offer list actually changed (avoids spamming updates).
 */
export async function notifyMembersNearBusiness(businessLat: number, businessLng: number) {
  // Pull members within a broad radius first (cheap bounding check via the
  // same geog column), then let nearby_active_offers do the precise
  // per-member distance filtering against their own push_radius_km.
  const { data: members, error } = await supabaseAdmin.rpc('members_within_radius', {
    p_lat: businessLat,
    p_lng: businessLng,
    p_radius_km: 20, // generous outer bound; per-member radius applied below
  })

  if (error) throw error
  await Promise.all((members as WalletMember[]).map(refreshMember))
}

/** Periodic sweep across every registered member. */
export async function refreshAllMembers() {
  const { data: members, error } = await supabaseAdmin
    .from('wallet_members')
    .select('id, google_object_id, home_lat, home_lng, push_radius_km, last_notified_offer_ids')
    .not('google_object_id', 'is', null)

  if (error) throw error
  await Promise.all((members as WalletMember[]).map(refreshMember))
}

async function refreshMember(member: WalletMember) {
  if (!member.google_object_id) return

  // Deliberately platform-wide: nearby_active_offers() ranks ANY registered
  // business's active campaigns within radius, not just the shop this
  // member originally scanned at. Don't filter by origin_business_id here.
  const { data: offers, error } = await supabaseAdmin.rpc('nearby_active_offers', {
    p_lat: member.home_lat,
    p_lng: member.home_lng,
    p_radius_km: member.push_radius_km,
    p_limit: 5,
  })
  if (error) throw error

  const nearbyOffers = (offers ?? []) as NearbyOffer[]
  const newIds = nearbyOffers.map((o) => o.offer_id).sort()
  const oldIds = [...(member.last_notified_offer_ids ?? [])].sort()
  const unchanged = JSON.stringify(newIds) === JSON.stringify(oldIds)
  if (unchanged) return // nothing new -> skip the API call and the notification

  await patchMembershipObject(member.google_object_id, nearbyOffers)

  // Log reach: one row per unique (member, offer) ever notified, powering
  // the notified -> redeemed conversion-rate metric on the dashboards.
  // ignoreDuplicates makes this a no-op on repeat appearances in the top-5
  // list so it doesn't inflate reach counts or overwrite the original
  // notified_at.
  if (nearbyOffers.length) {
    await supabaseAdmin.from('offer_notifications').upsert(
      nearbyOffers.map((o) => ({
        member_id: member.id,
        business_id: o.business_id,
        offer_id: o.offer_id,
      })),
      { onConflict: 'member_id,offer_id', ignoreDuplicates: true },
    )
  }

  await supabaseAdmin
    .from('wallet_members')
    .update({
      last_notified_offer_ids: newIds,
      last_notified_at: new Date().toISOString(),
    })
    .eq('id', member.id)
}
