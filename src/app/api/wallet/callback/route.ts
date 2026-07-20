import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const campaignId: string | undefined = body?.campaign_id
  const hostBusinessId: string | undefined = body?.host_business_id
  const claimToken: string | undefined = body?.claim_token

  if (!campaignId || !hostBusinessId || !claimToken) {
    return NextResponse.json(
      { error: 'campaign_id, host_business_id and claim_token are required' },
      { status: 400 },
    )
  }
  if (!UUID_RE.test(claimToken)) {
    return NextResponse.json({ error: 'claim_token is not a valid token' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin.rpc('claim_ad_credit_transaction', {
    p_host_business_id: hostBusinessId,
    p_campaign_id: campaignId,
    p_claim_token: claimToken,
  })

  if (error) {
    const status = /not found|inactive|insufficient/i.test(error.message) ? 409 : 500
    return NextResponse.json({ error: error.message }, { status })
  }

  return NextResponse.json({ success: true, creditsTransferred: data?.[0]?.credits_transferred ?? null })
}
