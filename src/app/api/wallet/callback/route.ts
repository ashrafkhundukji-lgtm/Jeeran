import { NextResponse } from 'next/server'

// Retired. This was the credit step of the old per-offer Apple pass flow
// (SaveToWalletButton → /api/wallet/generate → here → claim_ad_credit_transaction).
// It trusted whatever offer, host shop and token the caller sent, so anyone
// could move credits between shops. Nothing live calls it: the per-offer
// button was never rendered after the Wallet membership flow replaced it
// (credits now move only on a staff-confirmed redemption, /api/redeem).
export const dynamic = 'force-dynamic'

function gone() {
  return NextResponse.json({ error: 'This endpoint has been retired' }, { status: 410 })
}

export const POST = gone
export const GET = gone
