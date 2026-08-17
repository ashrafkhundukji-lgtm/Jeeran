import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import RedeemScanner from '@/components/RedeemScanner'

export const dynamic = 'force-dynamic'

// Auth gate mirrors dashboard/owner/page.tsx exactly — same session check,
// same onboarding/frozen redirects. /api/redeem re-derives businessId from
// the session itself (getAuthenticatedBusinessId, same as campaigns/route.ts)
// rather than trusting anything from the client, so this page doesn't need
// to pass a businessId down — it only needs to gate who gets to the page at
// all. There's no way to redeem for a business other than the one the
// signed-in staff account owns.
export default async function RedeemPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: business, error } = await supabase
    .from('businesses')
    .select('id, is_frozen')
    .eq('owner_id', user.id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!business) redirect('/dashboard/onboarding')
  if (business.is_frozen) redirect('/dashboard/frozen')

  return <RedeemScanner />
}
