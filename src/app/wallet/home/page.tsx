import { notFound } from 'next/navigation'
import { verifyMemberToken } from '@/lib/wallet/member-token'
import WalletHomeView from '@/components/WalletHomeView'

export const dynamic = 'force-dynamic'

// The hub every "Home" link in WalletSiteHeader points to — see that
// component's header comment. No DB read needed here: it only ever links
// out to pages that already do their own lookups, carrying the same signed
// member token forward.
export default async function WalletHomePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  if (!token) notFound()

  const decoded = verifyMemberToken(token)
  if (!decoded) notFound()

  return <WalletHomeView token={token} />
}
