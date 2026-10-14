import { supabaseAdmin } from './supabase-admin'

// campaigns.end_date for offers a page has ALREADY fetched (via
// nearby_active_offers() / get_top_ads(), which don't return it). Read-only
// lookup by id for the "Ends today" chip — it never filters or reorders
// the list it's attached to. Failures just mean no expiry chips.
export async function fetchOfferEndDates(offerIds: string[]): Promise<Map<string, string | null>> {
  if (offerIds.length === 0) return new Map()
  const { data } = await supabaseAdmin.from('campaigns').select('id, end_date').in('id', offerIds)
  return new Map((data ?? []).map((r: { id: string; end_date: string | null }) => [r.id, r.end_date]))
}
