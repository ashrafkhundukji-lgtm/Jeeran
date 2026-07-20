import { randomUUID } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getHostBusiness } from '@/lib/matchmaking'
import { getCampaignForClaim } from '@/lib/wallet/data'
import { buildCouponPass } from '@/lib/wallet/buildPass'
import { signClaimToken } from '@/lib/wallet/hmac'
import { WalletNotConfiguredError } from '@/lib/wallet/certificates'

// passkit-generator needs Node crypto/zip — not compatible with the edge runtime.
export const runtime = 'nodejs'
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

  // Minted here (not by the ledger transaction) because the pass has to be
  // built and downloaded before /api/wallet/callback ever runs — see
  // src/lib/wallet/hmac.ts. Threaded through to callback via a response
  // header (the body is the binary pass) so it can be stored on the
  // scans_and_claims row that transaction creates.
  const claimToken = randomUUID()
  const hash = signClaimToken(claimToken)
  const barcodeMessage = `jeeran://validate?claim=${claimToken}&hash=${hash}`
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const validationUrl = `${appUrl}/validate?claim=${claimToken}&hash=${hash}`
  const serialNumber = claimToken

  try {
    const buffer = await buildCouponPass({
      serialNumber,
      title: campaign.title,
      hostBusinessName: host.name,
      creatorLatitude: campaign.creatorLatitude,
      creatorLongitude: campaign.creatorLongitude,
      barcodeMessage,
      validationUrl,
    })

    return new NextResponse(new Blob([Uint8Array.from(buffer)]), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': `attachment; filename="${campaignId}.pkpass"`,
        'Cache-Control': 'no-store',
        'X-Jeeran-Claim-Token': claimToken,
      },
    })
  } catch (err) {
    if (err instanceof WalletNotConfiguredError) {
      return NextResponse.json({ error: err.message }, { status: 501 })
    }
    console.error('wallet/generate error:', err)
    return NextResponse.json({ error: 'Failed to generate wallet pass' }, { status: 500 })
  }
}
