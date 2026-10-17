import { supabaseAdmin } from '@/lib/supabase-admin'
import { offerWindowState } from '@/lib/offerWindow'

export interface CampaignForClaim {
  id: string
  title: string
  description: string | null
  bidPerView: number
  isActive: boolean
  creatorType: 'business'
  creatorId: string
  creatorLatitude: number | null
  creatorLongitude: number | null
}

export async function getCampaignForClaim(campaignId: string): Promise<CampaignForClaim | null> {
  const { data: campaign, error } = await supabaseAdmin
    .from('campaigns')
    .select('id, title, description, bid_per_view, is_active, start_date, end_date, creator_type, creator_id')
    .eq('id', campaignId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!campaign) return null

  const { data: creator } = await supabaseAdmin
    .from('businesses')
    .select('latitude, longitude')
    .eq('id', campaign.creator_id)
    .maybeSingle()

  return {
    id: campaign.id,
    title: campaign.title,
    description: campaign.description,
    bidPerView: campaign.bid_per_view,
    // Outside its start/end dates counts as inactive (see lib/offerWindow.ts).
    isActive: campaign.is_active && offerWindowState(campaign.start_date, campaign.end_date) === 'live',
    creatorType: campaign.creator_type,
    creatorId: campaign.creator_id,
    creatorLatitude: creator?.latitude ?? null,
    creatorLongitude: creator?.longitude ?? null,
  }
}
