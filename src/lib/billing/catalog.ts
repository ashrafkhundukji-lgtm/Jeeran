// Server-side price catalog. The client only ever sends a price_id; the
// server looks it up here to decide the real type/credits/mode rather than
// trusting client-supplied values for what money should buy.
//
// Each entry is only present if its Stripe price id env var is set, so an
// unconfigured pack just doesn't show up (graceful degradation, same spirit
// as the wallet cert handling) instead of the app crashing or lying about
// what's purchasable.
//
// 'addon' is a separate product line from 'subscription' (the base plan) —
// same Stripe subscription mode, but billed as its own Product/Price and
// tracked in business_addons rather than businesses.stripe_subscription_id/
// is_subscription_active (see that table's migration comment,
// supabase/migrations/20260823_instant_notify_addon.sql, for why the two
// can't share a column). addonKey identifies WHICH add-on for entries of
// that type — required there, meaningless for 'subscription'/'topup'.
export type CatalogEntryType = 'subscription' | 'topup' | 'addon'

export interface CatalogEntry {
  key: string
  priceId: string
  type: CatalogEntryType
  mode: 'subscription' | 'payment'
  creditsGranted: number
  label: string
  amountUsd: number
  addonKey?: string
}

// Shared constant so the catalog entry (below), the checkout/webhook routes,
// account.ts, and geo-notify.ts all key off the exact same string rather
// than each hardcoding 'instant_notify' independently.
export const INSTANT_NOTIFY_ADDON_KEY = 'instant_notify'

// Same sharing reasoning as INSTANT_NOTIFY_ADDON_KEY above. Values (10km/
// 25km) are NOT read from here — the ranking functions
// (business_reach_radius_km() in supabase/migrations/20260830_reach_radius_addon.sql)
// hardcode them against these same key strings, since the radius has to be
// evaluated inside a Postgres query (nearby_active_offers/nearby_businesses),
// not fetched from application code. Keep the two in sync if either changes.
export const REACH_EXTENDED_ADDON_KEY = 'reach_extended'
export const REACH_PREMIUM_ADDON_KEY = 'reach_premium'

function entry(key: string, envVar: string, rest: Omit<CatalogEntry, 'key' | 'priceId'>): CatalogEntry | null {
  const priceId = process.env[envVar]
  if (!priceId) return null
  return { key, priceId, ...rest }
}

export function getBillingCatalog(): CatalogEntry[] {
  const entries = [
    entry('subscription', 'STRIPE_PRICE_SUBSCRIPTION', {
      type: 'subscription',
      mode: 'subscription',
      creditsGranted: 100,
      label: 'Monthly Subscription',
      amountUsd: 49,
    }),
    entry('topup_small', 'STRIPE_PRICE_TOPUP_SMALL', {
      type: 'topup',
      mode: 'payment',
      creditsGranted: 500,
      label: '500 Credits',
      amountUsd: 12,
    }),
    entry('topup_medium', 'STRIPE_PRICE_TOPUP_MEDIUM', {
      type: 'topup',
      mode: 'payment',
      creditsGranted: 1000,
      label: '1,000 Credits',
      amountUsd: 20,
    }),
    entry('topup_large', 'STRIPE_PRICE_TOPUP_LARGE', {
      type: 'topup',
      mode: 'payment',
      creditsGranted: 5000,
      label: '5,000 Credits',
      amountUsd: 90,
    }),
    // Instant Notify: bypasses the once-daily notification batch so this
    // business's campaign fires its lock-screen push immediately and claims
    // a slot ahead of non-premium contenders — see src/lib/wallet/geo-notify.ts
    // notifyInstantOffer(). Does NOT affect nearby_active_offers() card
    // ranking (bid-per-view/tier), only which offers get an actual push.
    entry('instant_notify', 'STRIPE_PRICE_INSTANT_NOTIFY', {
      type: 'addon',
      mode: 'subscription',
      creditsGranted: 0,
      label: 'Instant Notify Add-on',
      amountUsd: 29,
      addonKey: INSTANT_NOTIFY_ADDON_KEY,
    }),
    // Reach radius: widens which customers this business is eligible to be
    // discovered/ranked for, beyond their own wallet_members.push_radius_km
    // (1km by default) — see business_reach_radius_km() in
    // 20260830_reach_radius_addon.sql. Two tiers, same business_addons/
    // webhook mechanism as instant_notify above (a business should only
    // ever have one active at a time — nothing in the checkout/webhook path
    // enforces that today, same as any other addon combination).
    entry('reach_extended', 'STRIPE_PRICE_REACH_EXTENDED', {
      type: 'addon',
      mode: 'subscription',
      creditsGranted: 0,
      label: 'Extended Reach Add-on (10km)',
      amountUsd: 19,
      addonKey: REACH_EXTENDED_ADDON_KEY,
    }),
    entry('reach_premium', 'STRIPE_PRICE_REACH_PREMIUM', {
      type: 'addon',
      mode: 'subscription',
      creditsGranted: 0,
      label: 'Premium Reach Add-on (25km)',
      amountUsd: 39,
      addonKey: REACH_PREMIUM_ADDON_KEY,
    }),
  ]
  return entries.filter((e): e is CatalogEntry => e !== null)
}

export function findCatalogEntryByPriceId(priceId: string): CatalogEntry | undefined {
  return getBillingCatalog().find((e) => e.priceId === priceId)
}
