import { createSign } from 'node:crypto'
import { WalletNotConfiguredError } from './certificates'

// Google Wallet API credentials — a free issuer account (unlike Apple's paid
// Developer Program). See README notes in .env.local for the signup steps.
// Stored as a base64-encoded service account JSON key, same pattern as the
// Apple cert env vars, so it survives host env var storage intact.
export function loadGoogleWalletCredentials() {
  const { GOOGLE_WALLET_ISSUER_ID, GOOGLE_WALLET_SERVICE_ACCOUNT_KEY_B64 } = process.env

  if (!GOOGLE_WALLET_ISSUER_ID || !GOOGLE_WALLET_SERVICE_ACCOUNT_KEY_B64) {
    throw new WalletNotConfiguredError('Google Wallet is not configured')
  }

  let keyJson: { client_email?: string; private_key?: string }
  try {
    keyJson = JSON.parse(Buffer.from(GOOGLE_WALLET_SERVICE_ACCOUNT_KEY_B64, 'base64').toString('utf8'))
  } catch {
    throw new WalletNotConfiguredError('GOOGLE_WALLET_SERVICE_ACCOUNT_KEY_B64 is not valid base64-encoded JSON')
  }
  if (!keyJson.client_email || !keyJson.private_key) {
    throw new WalletNotConfiguredError('Google Wallet service account key is missing client_email or private_key')
  }

  return {
    issuerId: GOOGLE_WALLET_ISSUER_ID,
    clientEmail: keyJson.client_email,
    privateKey: keyJson.private_key,
  }
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

// Google Wallet "save" links are a self-contained RS256 JWT (no OAuth
// round-trip needed) — signed with the issuer's service account key, same
// role Apple's Pass Type ID certificate plays for .pkpass signing.
export function signRS256Jwt(payload: object, privateKeyPem: string): string {
  const encodedHeader = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const encodedPayload = base64url(JSON.stringify(payload))
  const signingInput = `${encodedHeader}.${encodedPayload}`
  const signature = createSign('RSA-SHA256').update(signingInput).end().sign(privateKeyPem)
  return `${signingInput}.${base64url(signature)}`
}

export interface BuildGoogleWalletInput {
  serialNumber: string
  title: string
  hostBusinessName: string
  barcodeMessage: string
}

const GENERIC_CLASS_SUFFIX = 'jeeran_coupon'

// Builds a "Add to Google Wallet" save URL. Unlike Apple's binary .pkpass,
// this embeds the class + object definitions directly in the JWT — Google
// creates/updates them from the JWT payload on save, so no prior REST
// "insert class" call is needed for this to work.
export function buildGoogleWalletSaveUrl(input: BuildGoogleWalletInput): string {
  const { issuerId, clientEmail, privateKey } = loadGoogleWalletCredentials()

  const classId = `${issuerId}.${GENERIC_CLASS_SUFFIX}`
  const objectId = `${issuerId}.${input.serialNumber.replace(/-/g, '_')}`

  const genericClass = { id: classId }

  const genericObject = {
    id: objectId,
    classId,
    genericType: 'GENERIC_TYPE_UNSPECIFIED',
    state: 'ACTIVE',
    hexBackgroundColor: '#14181f',
    cardTitle: { defaultValue: { language: 'en', value: process.env.WALLET_ORG_NAME || 'Jeeran Network' } },
    subheader: { defaultValue: { language: 'en', value: input.hostBusinessName } },
    header: { defaultValue: { language: 'en', value: input.title } },
    barcode: { type: 'QR_CODE', value: input.barcodeMessage, alternateText: input.title },
    textModulesData: [
      { id: 'terms', header: 'Terms', body: 'Valid at participating Jeeran Network locations. One redemption per pass.' },
      { id: 'redeem', header: 'How to redeem', body: 'Show this pass to staff at the advertiser to redeem.' },
    ],
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const payload = {
    iss: clientEmail,
    aud: 'google',
    typ: 'savetowallet',
    iat: Math.floor(Date.now() / 1000),
    origins: appUrl ? [appUrl] : undefined,
    payload: {
      genericClasses: [genericClass],
      genericObjects: [genericObject],
    },
  }

  const jwt = signRS256Jwt(payload, privateKey)
  return `https://pay.google.com/gp/v/save/${jwt}`
}
