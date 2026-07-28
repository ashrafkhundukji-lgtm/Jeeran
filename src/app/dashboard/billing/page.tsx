import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getBillingAccountForUser } from '@/lib/billing/account'
import { getBillingCatalog } from '@/lib/billing/catalog'
import BillingView, { type LedgerEntry } from '@/components/BillingView'

export const dynamic = 'force-dynamic'

export default async function BillingPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const account = await getBillingAccountForUser(supabase, user.id)
  if (!account) redirect('/dashboard/onboarding')
  if (account.isFrozen) redirect('/dashboard/frozen')

  const [{ data: transactions }, { data: ownCampaigns }] = await Promise.all([
    supabase
      .from('billing_transactions')
      .select('*')
      .eq('account_type', account.type)
      .eq('account_id', account.id)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase.from('campaigns').select('id, title').eq('creator_type', account.type).eq('creator_id', account.id),
  ])

  const campaignIds = (ownCampaigns ?? []).map((c) => c.id)
  const titleById = new Map((ownCampaigns ?? []).map((c) => [c.id, c.title]))

  const { data: usage } = campaignIds.length
    ? await supabase
        .from('scans_and_claims')
        .select('id, credits_transferred, created_at, campaign_id')
        .in('campaign_id', campaignIds)
        .order('created_at', { ascending: false })
        .limit(50)
    : { data: [] as { id: string; credits_transferred: number; created_at: string; campaign_id: string }[] }

  const ledger: LedgerEntry[] = [
    ...(transactions ?? []).map((t) => ({
      id: t.id,
      date: t.created_at,
      amount: t.credits_granted,
      isCredit: true,
      kind: t.type as LedgerEntry['kind'],
      campaignTitle: null,
    })),
    ...(usage ?? []).map((u) => ({
      id: u.id,
      date: u.created_at,
      amount: -u.credits_transferred,
      isCredit: false,
      kind: 'usage' as const,
      campaignTitle: titleById.get(u.campaign_id) ?? null,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const catalog = getBillingCatalog()

  return (
    <BillingView
      accountName={account.name}
      isSubscriptionActive={account.isSubscriptionActive}
      adCredits={account.adCredits}
      catalog={catalog}
      ledger={ledger}
    />
  )
}
