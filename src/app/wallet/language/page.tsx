import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verifyMemberToken } from '@/lib/wallet/member-token'
import WalletLanguagePicker from '@/components/WalletLanguagePicker'

export const dynamic = 'force-dynamic'

// Reachable only from the Wallet card's "Change language" link (see
// offersToLinksModule in src/lib/wallet/google-membership-pass.ts) — same
// signed-token scheme already used for the "Other offers nearby" page
// (src/app/offers/nearby), so a customer never has to log in to change this.
export default async function WalletLanguagePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  if (!token) notFound()

  const decoded = verifyMemberToken(token)
  if (!decoded) notFound()

  const { data: member } = await supabaseAdmin
    .from('wallet_members')
    .select('preferred_language')
    .eq('id', decoded.memberId)
    .maybeSingle()
  if (!member) notFound()

  return <WalletLanguagePicker token={token} initialLocale={member.preferred_language} />
}
