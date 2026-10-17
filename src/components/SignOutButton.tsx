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
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm">
        <span className="text-brand-muted">{copy.profile.signOutConfirm}</span>
        <button type="button" onClick={handleSignOut} className="min-h-11 rounded-xl px-3 font-semibold text-brand-coral">
          {copy.profile.signOutConfirmYes}
        </button>
        <button type="button" onClick={() => setConfirming(false)} className="min-h-11 rounded-xl px-3 font-semibold text-brand-muted">
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
