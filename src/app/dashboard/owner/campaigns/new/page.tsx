import { requireOwnerBusiness } from '@/lib/ownerContext'
import CampaignForm, { type CampaignFormBusiness } from '@/components/owner/CampaignForm'
import type { OwnerCampaign } from '@/components/owner/campaigns'

export const dynamic = 'force-dynamic'

// New offer — or "duplicate" when ?from=<campaign id> is given: the source
// campaign's content prefills the form (dates cleared), and saving creates
// a brand-new campaign through the same POST /api/campaigns as a fresh one.
export default async function NewCampaignPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const { from } = await searchParams
  const { supabase, business } = await requireOwnerBusiness(
    'id, name, category, logo_url, cover_url, ad_credits, is_frozen',
  )

  const [{ data: active }, { data: source }] = await Promise.all([
    supabase.from('campaigns').select('id').eq('creator_type', 'business').eq('creator_id', business.id as string).eq('is_active', true).limit(1),
    from
      ? supabase.from('campaigns').select('*').eq('id', from).eq('creator_type', 'business').eq('creator_id', business.id as string).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  return (
    <CampaignForm
      mode={source ? 'duplicate' : 'new'}
      business={business as unknown as CampaignFormBusiness}
      campaign={source ? ({ ...(source as OwnerCampaign), start_date: null, end_date: null } as OwnerCampaign) : null}
      hasOtherActive={(active ?? []).length > 0}
    />
  )
}
