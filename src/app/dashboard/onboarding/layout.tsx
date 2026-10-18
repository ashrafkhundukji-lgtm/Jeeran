import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// An owner who already has a business has nothing to onboard: send them to
// their dashboard instead of showing a form whose submit can only fail
// (POST /api/onboarding answers 409 for them). Same lookup as
// src/app/dashboard/page.tsx; signed-out visitors are already redirected to
// /login by src/proxy.ts.
export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) {
    const { data: business } = await supabase.from('businesses').select('id').eq('owner_id', user.id).maybeSingle()
    if (business) redirect('/dashboard/owner')
  }
  return children
}
