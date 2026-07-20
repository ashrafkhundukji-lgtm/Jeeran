/**
 * Google Wallet callback endpoint.
 *
 * Configure this URL in the Google Pay & Wallet Console (Issuer settings ->
 * "Callback URL"). Google POSTs here with a signed JWT whenever a customer
 * saves or removes a pass tied to your issuer — this is how we learn the
 * objectId exists so it can be PATCHed later.
 *
 * Docs: https://developers.google.com/wallet/generic/callback-object
 */

import { NextRequest, NextResponse } from 'next/server'
import { OAuth2Client } from 'google-auth-library'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const GOOGLE_PAY_AUD = 'google'
const oauthClient = new OAuth2Client()

// Google Wallet's callback JWT payload adds an `eventInfo` array on top of
// the standard OIDC claims google-auth-library's TokenPayload models —
// not part of that library's type, so it's declared separately here.
interface WalletCallbackPayload {
  eventInfo?: Array<{ objectId: string; eventType: string }>
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const signedMessage: string | undefined = body?.signedMessage

  if (!signedMessage) {
    return NextResponse.json({ error: 'missing signedMessage' }, { status: 400 })
  }

  // Verify the JWT actually came from Google before trusting the payload.
  let payload
  try {
    const ticket = await oauthClient.verifySignedJwtWithCertsAsync(
      signedMessage,
      await fetchGoogleWalletCerts(),
      GOOGLE_PAY_AUD,
    )
    payload = ticket.getPayload() as WalletCallbackPayload | undefined
  } catch (err) {
    console.error('Google Wallet callback: signature verification failed', err)
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
  }

  const events = payload?.eventInfo ?? []

  for (const evt of events) {
    const objectId: string = evt.objectId
    const eventType: string = evt.eventType // "save" | "del"
    if (!objectId) continue

    if (eventType === 'save') {
      // objectId format from createMembershipObject: `${issuerId}.member_${memberId}`
      const memberId = objectId.split('.member_')[1]
      if (!memberId) continue

      await supabaseAdmin
        .from('wallet_members')
        .update({ google_object_id: objectId, updated_at: new Date().toISOString() })
        .eq('id', memberId)
    }

    if (eventType === 'del') {
      await supabaseAdmin.from('wallet_members').update({ google_object_id: null }).eq('google_object_id', objectId)
    }
  }

  return NextResponse.json({ ok: true })
}

async function fetchGoogleWalletCerts() {
  const res = await fetch('https://www.gstatic.com/wallet/generic/loyalty_public_key.json')
  return res.json()
}
