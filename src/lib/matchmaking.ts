import { supabaseAdmin } from './supabase-admin'

export interface MatchedAd {
  campaignId: string
  title: string
  description: string | null
  bidPerView: number
  creatorType: 'business'
  creatorId: string
  creatorName: string | null
}

interface TopAdRow {
  campaign_id: string
  title: string
  description: string | null
  bid_per_view: number
  creator_type: 'business'
  creator_id: string
}

// Calls the get_top_ads() Postgres function (supabase/migrations/20260711_get_top_ads_fn.sql),
// which handles exclusion + credit-check + bid ranking in one query, then
// resolves creator display names for the returned ads.
export async function getTopAdsForBusiness(hostBusinessId: string, limit = 3): Promise<MatchedAd[]> {
  const { data: ads, error } = await supabaseAdmin.rpc('get_top_ads', {
    p_host_business_id: hostBusinessId,
    p_limit: limit,
  })

  if (error) throw new Error(error.message)

  const rows = (ads ?? []) as TopAdRow[]
  if (rows.length === 0) return []

  const businessIds = rows.map((a) => a.creator_id)

  const { data: businessNames } = businessIds.length
    ? await supabaseAdmin.from('businesses').select('id, name').in('id', businessIds)
    : { data: [] as { id: string; name: string }[] }

  const nameById = new Map<string, string>()
  for (const b of businessNames ?? []) nameById.set(b.id, b.name)

  return rows.map((a) => ({
    campaignId: a.campaign_id,
    title: a.title,
    description: a.description,
    bidPerView: a.bid_per_view,
    creatorType: a.creator_type,
    creatorId: a.creator_id,
    creatorName: nameById.get(a.creator_id) ?? null,
  }))
}

export interface HostBusiness {
  id: string
  name: string
  category: string
}

export async function getHostBusiness(businessId: string): Promise<HostBusiness | null> {
  const { data, error } = await supabaseAdmin
    .from('businesses')
    .select('id, name, category')
    .eq('id', businessId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}
