import type { SupabaseClient } from '@supabase/supabase-js'

export interface BillingAccount {
  type: 'business'
  id: string
  name: string
  stripeCustomerId: string | null
  isSubscriptionActive: boolean
  adCredits: number
}

// Resolves the caller's billing account. Pass a session-scoped client so
// RLS enforces "only your own row" is visible.
export async function getBillingAccountForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<BillingAccount | null> {
  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('id, name, stripe_customer_id, is_subscription_active, ad_credits')
    .eq('owner_id', userId)
    .maybeSingle()
  if (businessError) throw new Error(businessError.message)
  if (!business) return null

  return {
    type: 'business',
    id: business.id,
    name: business.name,
    stripeCustomerId: business.stripe_customer_id,
    isSubscriptionActive: business.is_subscription_active,
    adCredits: business.ad_credits,
  }
}
