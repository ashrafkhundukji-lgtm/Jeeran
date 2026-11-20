import { randomUUID } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { guardPassRequest } from '@/lib/wallet/passGuard'
import { buildCouponPass } from '@/lib/wallet/buildPass'
import { signClaimToken } from '@/lib/wallet/hmac'
import { WalletNotConfiguredError } from '@/lib/wallet/certificates'

// passkit-generator needs Node crypto/zip — not compatible with the edge runtime.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  // Anonymous, but rate limited and eligibility-checked (src/lib/wallet/passGuard.ts).
  const body = await req.json().catch(() => null)
  const guard = await guardPassRequest(req, body)
  if (!guard.ok) return guard.response
  const { campaign, host } = guard
  const campaignId = campaign.id

  // Signed claim token for the pass barcode (src/lib/wallet/hmac.ts). The
  // old credit callback that used to record it was retired; this route only
  // builds the pass (and returns 501 until Apple signing exists).
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
