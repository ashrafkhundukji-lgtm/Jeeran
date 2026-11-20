import { randomUUID } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { guardPassRequest } from '@/lib/wallet/passGuard'
import { buildGoogleWalletSaveUrl } from '@/lib/wallet/google'
import { signClaimToken } from '@/lib/wallet/hmac'
import { WalletNotConfiguredError } from '@/lib/wallet/certificates'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  // Anonymous, but rate limited and eligibility-checked (src/lib/wallet/passGuard.ts).
  const body = await req.json().catch(() => null)
  const guard = await guardPassRequest(req, body)
  if (!guard.ok) return guard.response
  const { campaign, host } = guard

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
