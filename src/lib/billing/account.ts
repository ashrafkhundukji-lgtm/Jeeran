import type { SupabaseClient } from '@supabase/supabase-js'
import { INSTANT_NOTIFY_ADDON_KEY, REACH_EXTENDED_ADDON_KEY, REACH_PREMIUM_ADDON_KEY } from './catalog'

export type ReachTier = 'none' | 'extended' | 'premium'

export interface BillingAccount {
  type: 'business'
  id: string
  name: string
  stripeCustomerId: string | null
  isSubscriptionActive: boolean
  adCredits: number
  isFrozen: boolean
  isInstantNotifyActive: boolean
  reachTier: ReachTier
}

// Resolves the caller's billing account. Pass a session-scoped client so
// RLS enforces "only your own row" is visible.
export async function getBillingAccountForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<BillingAccount | null> {
  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('id, name, stripe_customer_id, is_subscription_active, ad_credits, is_frozen')
    .eq('owner_id', userId)
    .maybeSingle()
  if (businessError) throw new Error(businessError.message)
  if (!business) return null

  // Separate lookup, not a join: business_addons is keyed by (business_id,
  // addon_key) with its own RLS ("owner can read") — see
  // supabase/migrations/20260823_instant_notify_addon.sql. A missing row
  // just means the add-on was never purchased, not an error.
  const { data: addon, error: addonError } = await supabase
    .from('business_addons')
    .select('is_active')
    .eq('business_id', business.id)
    .eq('addon_key', INSTANT_NOTIFY_ADDON_KEY)
    .maybeSingle()
  if (addonError) throw new Error(addonError.message)

  // Separate lookup for both reach tiers at once — same "missing row means
  // never purchased" reasoning as instant_notify above. Premium wins if
  // somehow both are active (matches business_reach_radius_km()'s max()).
  const { data: reachAddons, error: reachError } = await supabase
    .from('business_addons')
    .select('addon_key, is_active')
    .eq('business_id', business.id)
    .in('addon_key', [REACH_EXTENDED_ADDON_KEY, REACH_PREMIUM_ADDON_KEY])
  if (reachError) throw new Error(reachError.message)

  const activeReachKeys = new Set((reachAddons ?? []).filter((a) => a.is_active).map((a) => a.addon_key))
  const reachTier: ReachTier = activeReachKeys.has(REACH_PREMIUM_ADDON_KEY)
    ? 'premium'
    : activeReachKeys.has(REACH_EXTENDED_ADDON_KEY)
      ? 'extended'
      : 'none'

  return {
    type: 'business',
    id: business.id,
    name: business.name,
    stripeCustomerId: business.stripe_customer_id,
    isSubscriptionActive: business.is_subscription_active,
    adCredits: business.ad_credits,
    isFrozen: business.is_frozen,
    isInstantNotifyActive: addon?.is_active ?? false,
    reachTier,
  }
}
