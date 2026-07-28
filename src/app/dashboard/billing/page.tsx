import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getBillingAccountForUser } from '@/lib/billing/account'
import { getBillingCatalog } from '@/lib/billing/catalog'
import BillingActions from '@/components/BillingActions'
import SiteLogo from '@/components/SiteLogo'

export const dynamic = 'force-dynamic'

interface LedgerRow {
  id: string
  date: string
  label: string
  amount: number
  isCredit: boolean
}

export default async function BillingPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const account = await getBillingAccountForUser(supabase, user.id)
  if (!account) redirect('/dashboard/onboarding')

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

  const purchaseLabels: Record<string, string> = {
    topup: 'Credit top-up',
    subscription_initial: 'Subscription started',
    subscription_renewal: 'Subscription renewed',
  }

  const ledger: LedgerRow[] = [
    ...(transactions ?? []).map((t) => ({
      id: t.id,
      date: t.created_at,
      label: purchaseLabels[t.type] ?? t.type,
      amount: t.credits_granted,
      isCredit: true,
    })),
    ...(usage ?? []).map((u) => ({
      id: u.id,
      date: u.created_at,
      label: `Ad claimed: ${titleById.get(u.campaign_id) ?? 'campaign'}`,
      amount: -u.credits_transferred,
      isCredit: false,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const catalog = getBillingCatalog()

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <SiteLogo className="h-14 mb-6" />
      <h1 className="text-xl font-semibold mb-1">Billing</h1>
      <p className="text-sm text-neutral-500 mb-6">{account.name}</p>

      <div className="flex items-center justify-between border border-neutral-200 rounded-xl p-4 mb-8">
        <div>
          <p className="text-xs text-neutral-500 mb-1">Subscription status</p>
          <p className={`text-sm font-semibold ${account.isSubscriptionActive ? 'text-emerald-600' : 'text-red-600'}`}>
            {account.isSubscriptionActive ? 'نشط' : 'غير نشط'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-neutral-500 mb-1">Credits</p>
          <p className="text-sm font-semibold">{account.adCredits}</p>
        </div>
      </div>

      <BillingActions catalog={catalog} isSubscriptionActive={account.isSubscriptionActive} />

      <section className="mt-10">
        <h2 className="text-lg font-semibold mb-3">History</h2>
        {ledger.length === 0 ? (
          <p className="text-sm text-neutral-400">No activity yet.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {ledger.map((row) => (
              <div
                key={row.id}
                className="flex items-center justify-between text-sm border-b border-neutral-100 py-2"
              >
                <div>
                  <div>{row.label}</div>
                  <div className="text-xs text-neutral-400">{new Date(row.date).toLocaleString()}</div>
                </div>
                <div className={row.isCredit ? 'text-emerald-600 font-medium' : 'text-neutral-500'}>
                  {row.amount >= 0 ? '+' : ''}
                  {row.amount}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
