import { notFound } from 'next/navigation'
import { requireOwnerBusiness } from '@/lib/ownerContext'
import CampaignForm, { type CampaignFormBusiness } from '@/components/owner/CampaignForm'
import type { OwnerCampaign } from '@/components/owner/campaigns'

export const dynamic = 'force-dynamic'

export default async function EditCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, business } = await requireOwnerBusiness(
    'id, name, category, logo_url, cover_url, ad_credits, is_frozen',
  )
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .eq('creator_type', 'business')
    .eq('creator_id', business.id as string)
    .maybeSingle()
  if (!campaign) notFound()

  return (
    <CampaignForm
      mode="edit"
      business={business as unknown as CampaignFormBusiness}
      campaign={campaign as OwnerCampaign}
      hasOtherActive={false}
    />
  )
}
