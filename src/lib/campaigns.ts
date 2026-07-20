import type { SupabaseClient } from '@supabase/supabase-js'

// PRD: the base subscription lets an account "manage 1 active campaign".
// The DB enforces this as the source of truth (campaigns_one_active_per_creator
// partial unique index) — this is the friendly pre-check so the API can
// return a clear 409 instead of a raw constraint-violation message.
export async function hasActiveCampaign(
  supabase: SupabaseClient,
  creatorType: 'business',
  creatorId: string,
  excludeCampaignId?: string,
): Promise<boolean> {
  let query = supabase
    .from('campaigns')
    .select('id', { count: 'exact', head: true })
    .eq('creator_type', creatorType)
    .eq('creator_id', creatorId)
    .eq('is_active', true)

  if (excludeCampaignId) query = query.neq('id', excludeCampaignId)

  const { count, error } = await query
  if (error) throw new Error(error.message)
  return (count ?? 0) > 0
}
