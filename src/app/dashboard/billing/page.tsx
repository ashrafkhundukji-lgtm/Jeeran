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

  // Redemption credit transfers (ledger since 20261017c_ad_credit_transfers.sql):
  // rows where this shop paid (its offer was redeemed by a customer another
  // shop brought in) or earned (a customer it brought in redeemed elsewhere).
  // Session client — RLS limits this to the owner's own rows.
  const { data: transfers } = await supabase
    .from('ad_credit_transfers')
    .select('id, offer_id, from_business_id, to_business_id, amount, created_at')
    .or(`from_business_id.eq.${account.id},to_business_id.eq.${account.id}`)
    .order('created_at', { ascending: false })
    .limit(50)

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
      addonKey: t.addon_key ?? null,
    })),
    ...(transfers ?? []).map((t) => {
      const paid = t.from_business_id === account.id
      return {
        id: t.id,
        date: t.created_at,
        amount: paid ? -t.amount : t.amount,
        isCredit: !paid,
        kind: (paid ? 'spent' : 'earned') as LedgerEntry['kind'],
        campaignTitle: paid && t.offer_id ? (titleById.get(t.offer_id) ?? null) : null,
        addonKey: null,
      }
    }),
    ...(usage ?? []).map((u) => ({
      id: u.id,
      date: u.created_at,
      amount: -u.credits_transferred,
      isCredit: false,
      kind: 'usage' as const,
      campaignTitle: titleById.get(u.campaign_id) ?? null,
      addonKey: null,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const catalog = getBillingCatalog()

  return (
    <BillingView
      isSubscriptionActive={account.isSubscriptionActive}
      isInstantNotifyActive={account.isInstantNotifyActive}
      reachTier={account.reachTier}
      adCredits={account.adCredits}
      catalog={catalog}
      ledger={ledger}
    />
  )
}
