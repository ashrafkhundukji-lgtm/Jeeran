import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import OwnerLeaderboardView from '@/components/OwnerLeaderboardView'

export const dynamic = 'force-dynamic'

export default async function OwnerLeaderboardPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('id, is_frozen')
    .eq('owner_id', user.id)
    .maybeSingle()
  if (businessError) throw new Error(businessError.message)
  if (!business) redirect('/dashboard/onboarding')
  if (business.is_frozen) redirect('/dashboard/frozen')

  return <OwnerLeaderboardView businessId={business.id} />
}
