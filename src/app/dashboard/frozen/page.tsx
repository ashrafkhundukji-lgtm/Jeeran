import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import FrozenView from '@/components/FrozenView'

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

  // Same wa.me digits-only requirement as the customer-facing offer page
  // (see src/app/offers/[campaignId]/page.tsx) — unset in an environment
  // that hasn't configured a support line, in which case FrozenView just
  // shows the plain "contact support" text with no button.
  const supportWhatsappDigits = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP?.replace(/\D/g, '') || null
  const supportWhatsappUrl = supportWhatsappDigits ? `https://wa.me/${supportWhatsappDigits}` : null

  return <FrozenView reason={business.frozen_reason} supportWhatsappUrl={supportWhatsappUrl} />
}
