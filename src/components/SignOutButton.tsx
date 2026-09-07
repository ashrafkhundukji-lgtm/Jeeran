'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useLocale } from '@/lib/i18n/useLocale'
import { DASHBOARD_COPY } from '@/lib/i18n/dashboard'

export default function SignOutButton({
  className = 'text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors',
}: {
  className?: string
}) {
  const router = useRouter()
  const [locale] = useLocale()
  const copy = DASHBOARD_COPY[locale]
  const [confirming, setConfirming] = useState(false)

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // Two-tap in-place confirm (design_handoff_jeeran_mobile/README.md §5's
  // "Confirm before signing out") rather than a native window.confirm() —
  // nothing else in this app uses a browser-native dialog, so this stays
  // consistent with the rest of the UI instead of breaking out of it.
  if (confirming) {
    return (
      <div className="flex items-center justify-center gap-3 text-sm">
        <span className="text-neutral-500">{copy.profile.signOutConfirm}</span>
        <button onClick={handleSignOut} className="font-semibold text-[#dc2626]">
          {copy.profile.signOutConfirmYes}
        </button>
        <button onClick={() => setConfirming(false)} className="font-medium text-neutral-400">
          {copy.campaigns.cancel}
        </button>
      </div>
    )
  }

  return (
    <button onClick={() => setConfirming(true)} className={className}>
      {copy.nav.signOut}
    </button>
  )
}
