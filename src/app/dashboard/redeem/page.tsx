import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import RedeemScanner, { type RecentRedemption } from '@/components/RedeemScanner'

export const dynamic = 'force-dynamic'

// Auth gate mirrors dashboard/owner/page.tsx exactly — same session check,
// same onboarding/frozen redirects. /api/redeem re-derives businessId from
// the session itself (getAuthenticatedBusinessId, same as campaigns/route.ts)
// rather than trusting anything from the client, so this page doesn't need
// to pass a businessId down — it only needs to gate who gets to the page at
// all. There's no way to redeem for a business other than the one the
// signed-in staff account owns.
export default async function RedeemPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: business, error } = await supabase
    .from('businesses')
    .select('id, is_frozen')
    .eq('owner_id', user.id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!business) redirect('/dashboard/onboarding')
  if (business.is_frozen) redirect('/dashboard/frozen')

  // "Recent redemptions" under the scanner — read-only, this business only
  // (ownership proven above, same reasoning as the owner page's admin read).
  const { data: rows } = await supabaseAdmin
    .from('redemptions')
    .select('id, offer_id, redeemed_at')
    .eq('business_id', business.id)
    .order('redeemed_at', { ascending: false })
    .limit(8)
  const offerIds = [...new Set((rows ?? []).map((r) => r.offer_id))]
  const { data: offers } = offerIds.length
    ? await supabaseAdmin.from('campaigns').select('id, title').in('id', offerIds)
    : { data: [] as { id: string; title: string }[] }
  const titleById = new Map((offers ?? []).map((o) => [o.id, o.title]))
  const recent: RecentRedemption[] = (rows ?? []).map((r) => ({
    id: r.id,
    title: titleById.get(r.offer_id) ?? '',
    at: r.redeemed_at,
  }))

  return <RedeemScanner recent={recent} />
}
