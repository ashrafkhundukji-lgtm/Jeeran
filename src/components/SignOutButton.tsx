'use client'

import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useLocale } from '@/lib/i18n/useLocale'
import { DASHBOARD_COPY } from '@/lib/i18n/dashboard'

export default function SignOutButton() {
  const router = useRouter()
  const [locale] = useLocale()
  const copy = DASHBOARD_COPY[locale]

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
    >
      {copy.nav.signOut}
    </button>
  )
}
