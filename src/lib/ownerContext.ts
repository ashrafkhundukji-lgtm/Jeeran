import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'

// Shared auth gate for owner pages that need the business row: same session
// check + onboarding/frozen redirects as dashboard/owner/page.tsx.
export async function requireOwnerBusiness<T extends string>(columns: T) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: business, error } = await supabase
    .from('businesses')
    .select(columns)
    .eq('owner_id', user.id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!business) redirect('/dashboard/onboarding')
  const row = business as unknown as Record<string, unknown>
  if (row.is_frozen) redirect('/dashboard/frozen')
  return { supabase, user, business: row }
}
