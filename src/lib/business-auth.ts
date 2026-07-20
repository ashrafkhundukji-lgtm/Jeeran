import { createSupabaseServerClient } from '@/lib/supabase-server'

// Shared by every business-scoped route (campaigns, redeem, dashboard
// redemptions): resolves the signed-in session to the business it owns.
// Previously duplicated inline in src/app/api/campaigns/route.ts and
// src/app/api/validate/route.ts.
export async function getAuthenticatedBusinessId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()

  return business?.id ?? null
}
