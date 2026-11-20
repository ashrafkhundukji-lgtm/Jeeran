import { redirect } from 'next/navigation'
import { requireOwnerBusiness } from '@/lib/ownerContext'

export const dynamic = 'force-dynamic'

// "My offer" app shortcut: the switched-on offer, else the latest one, else
// the create form.
export default async function MyOfferShortcut() {
  const { supabase, business } = await requireOwnerBusiness('id, is_frozen')
  const { data: offer } = await supabase
    .from('campaigns')
    .select('id')
    .eq('creator_type', 'business')
    .eq('creator_id', business.id as string)
    .order('is_active', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  redirect(offer ? `/dashboard/owner/campaigns/${offer.id}` : '/dashboard/owner/campaigns/new')
}
