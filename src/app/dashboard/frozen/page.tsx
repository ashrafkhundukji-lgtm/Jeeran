import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import SiteLogo from '@/components/SiteLogo'
import SignOutButton from '@/components/SignOutButton'

export const dynamic = 'force-dynamic'

export default async function FrozenPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: business } = await supabase
    .from('businesses')
    .select('is_frozen, frozen_reason')
    .eq('owner_id', user.id)
    .maybeSingle()

  // Only meant to be reached while frozen — if it's been lifted, send the
  // owner back to their normal dashboard instead of showing a stale notice.
  if (!business?.is_frozen) redirect('/dashboard/owner')

  return (
    <main className="max-w-sm mx-auto px-4 py-16 text-center">
      <div className="flex justify-center mb-8">
        <SiteLogo className="h-20" />
      </div>

      <h1 className="text-xl font-semibold mb-2">Account temporarily frozen</h1>
      <p className="text-sm text-neutral-600 mb-4">
        Your shop account has been paused and isn&apos;t visible to customers or able to run campaigns right now.
      </p>
      {business.frozen_reason && (
        <p className="text-sm text-neutral-500 bg-neutral-50 border border-neutral-200 rounded-lg p-3 mb-4">
          {business.frozen_reason}
        </p>
      )}
      <p className="text-sm text-neutral-500 mb-8">Contact support to resolve this.</p>

      <SignOutButton />
    </main>
  )
}
