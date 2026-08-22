import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import ProfileView from '@/components/ProfileView'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: business, error: businessError }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
    supabase.from('businesses').select('*').eq('owner_id', user.id).maybeSingle(),
  ])
  if (businessError) throw new Error(businessError.message)
  if (!business) redirect('/dashboard/onboarding')
  if (business.is_frozen) redirect('/dashboard/frozen')

  return (
    <ProfileView
      email={user.email ?? ''}
      fullName={profile?.full_name ?? ''}
      businessName={business.name}
      category={business.category}
      latitude={business.latitude}
      longitude={business.longitude}
      phone={business.phone}
      whatsapp={business.whatsapp}
    />
  )
}
