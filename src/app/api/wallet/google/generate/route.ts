import { randomUUID } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getHostBusiness } from '@/lib/matchmaking'
import { getCampaignForClaim } from '@/lib/wallet/data'
import { buildGoogleWalletSaveUrl } from '@/lib/wallet/google'
import { signClaimToken } from '@/lib/wallet/hmac'
import { WalletNotConfiguredError } from '@/lib/wallet/certificates'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const campaignId: string | undefined = body?.campaign_id
  const hostBusinessId: string | undefined = body?.host_business_id

  if (!campaignId || !hostBusinessId) {
    return NextResponse.json({ error: 'campaign_id and host_business_id are required' }, { status: 400 })
  }

  const [campaign, host] = await Promise.all([
    getCampaignForClaim(campaignId),
    getHostBusiness(hostBusinessId),
  ])

  if (!campaign || !campaign.isActive) {
    return NextResponse.json({ error: 'Campaign not found or inactive' }, { status: 404 })
  }
  if (!host) {
    return NextResponse.json({ error: 'Host business not found' }, { status: 404 })
  }

  // Same claim token + HMAC scheme as the Apple pass (src/lib/wallet/hmac.ts)
  // so /validate and the redemption ledger stay platform-agnostic.
  const claimToken = randomUUID()
  const hash = signClaimToken(claimToken)
  const barcodeMessage = `jeeran://validate?claim=${claimToken}&hash=${hash}`

  try {
    const saveUrl = buildGoogleWalletSaveUrl({
      serialNumber: claimToken,
      title: campaign.title,
      hostBusinessName: host.name,
      barcodeMessage,
    })

    return NextResponse.json({ saveUrl, claimToken })
  } catch (err) {
    if (err instanceof WalletNotConfiguredError) {
      return NextResponse.json({ error: err.message }, { status: 501 })
    }
    console.error('wallet/google/generate error:', err)
    return NextResponse.json({ error: 'Failed to generate Google Wallet pass' }, { status: 500 })
  }
}
