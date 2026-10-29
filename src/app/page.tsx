import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import LandingPage from '@/components/LandingPage'
import { isIOSRequest } from '@/lib/platform'

export default async function Home() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  // iPhone visitors get a one-line "Android for now" notice in the hero.
  return <LandingPage ios={await isIOSRequest()} />
}
