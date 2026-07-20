// Server-side price catalog. The client only ever sends a price_id; the
// server looks it up here to decide the real type/credits/mode rather than
// trusting client-supplied values for what money should buy.
//
// Each entry is only present if its Stripe price id env var is set, so an
// unconfigured pack just doesn't show up (graceful degradation, same spirit
// as the wallet cert handling) instead of the app crashing or lying about
// what's purchasable.
export type CatalogEntryType = 'subscription' | 'topup'

export interface CatalogEntry {
  key: string
  priceId: string
  type: CatalogEntryType
  mode: 'subscription' | 'payment'
  creditsGranted: number
  label: string
  amountUsd: number
}

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
  ]
  return entries.filter((e): e is CatalogEntry => e !== null)
}

export function findCatalogEntryByPriceId(priceId: string): CatalogEntry | undefined {
  return getBillingCatalog().find((e) => e.priceId === priceId)
}
