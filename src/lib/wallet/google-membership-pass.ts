/**
 * Google Wallet — "Jeeran Offers" membership pass
 *
 * Replaces the one-pass-per-offer model with a single persistent Generic
 * pass per customer. We PATCH this object whenever nearby offers change,
 * which refreshes the card and can push a lock-screen notification via the
 * `messages` field.
 */

import { GoogleAuth } from 'google-auth-library'
import { loadGoogleWalletCredentials, signRS256Jwt } from './google'
import { signMemberToken } from './member-token'

const CLASS_SUFFIX = 'jeeran_offers_membership'
const BASE_URL = 'https://walletobjects.googleapis.com/walletobjects/v1'

// Brand assets — set once at object creation (see createMembershipObject).
// No existing helper loads brand asset URLs from env/constants elsewhere in
// the wallet code (the legacy one-off flow in google.ts hardcodes its own,
// different hexBackgroundColor inline), so these live here rather than in a
// shared module that doesn't otherwise exist yet.
const BRAND_NAVY = '#1E3A8A'
const LOGO_URL = 'https://jeeran.vercel.app/wallet-logo-square.png'
const HERO_IMAGE_URL = 'https://jeeran.vercel.app/wallet-hero-banner.png'

function classId(): string {
  const { issuerId } = loadGoogleWalletCredentials()
  return `${issuerId}.${CLASS_SUFFIX}`
}

async function client() {
  const { clientEmail, privateKey } = loadGoogleWalletCredentials()
  const auth = new GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: ['https://www.googleapis.com/auth/wallet_object.issuer'],
  })
  return auth.getClient()
}

/**
 * Idempotent: creates the shared Generic pass CLASS if it doesn't exist yet.
 * Safe to call before every registration — the GET-then-create check below
 * keeps repeat calls cheap once the class exists.
 */
export async function ensureMembershipClass() {
  const authClient = await client()
  const id = classId()
  const url = `${BASE_URL}/genericClass/${id}`

  const existing = await authClient.request({ url, method: 'GET' }).catch((e: unknown) => {
    if (e && typeof e === 'object' && 'response' in e && (e as { response?: { status?: number } }).response?.status === 404) {
      return null
    }
    throw e
  })
  if (existing) return

  await authClient.request({
    url: `${BASE_URL}/genericClass`,
    method: 'POST',
    data: {
      id,
      classTemplateInfo: {
        cardTemplateOverride: {
          cardRowTemplateInfos: [
            {
              twoItems: {
                startItem: {
                  firstValue: { fields: [{ fieldPath: "object.textModulesData['nearby_1']" }] },
                },
                endItem: {
                  firstValue: { fields: [{ fieldPath: "object.textModulesData['nearby_2']" }] },
                },
              },
            },
          ],
        },
      },
    },
  })
}

/**
 * Builds the "Add to Google Wallet" save URL for an already-created object.
 * This is a separate signing flow from the OAuth2 REST client used above —
 * save URLs are a self-contained RS256 JWT signed directly with the issuer's
 * service-account private key (per Google Wallet docs), not a REST call.
 * Reuses signRS256Jwt from google.ts (the one-off flow's buildGoogleWalletSaveUrl
 * signs the same way, just with an inline class+object payload instead of a
 * reference to an object that already exists) rather than a second JWT
 * implementation.
 */
export async function buildSaveUrl(objectId: string): Promise<string> {
  const { clientEmail, privateKey } = loadGoogleWalletCredentials()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  const payload = {
    iss: clientEmail,
    aud: 'google',
    typ: 'savetowallet',
    iat: Math.floor(Date.now() / 1000),
    origins: appUrl ? [appUrl] : undefined,
    payload: {
      genericObjects: [{ id: objectId }],
    },
  }

  const jwt = signRS256Jwt(payload, privateKey)
  return `https://pay.google.com/gp/v/save/${jwt}`
}

export interface NearbyOffer {
  offer_id: string
  business_id: string
  business_name: string
  offer_title: string
  offer_description: string | null
  distance_km: number
}

/**
 * Creates the per-customer OBJECT (the actual pass instance) at save-time.
 * Returns the objectId to store in wallet_members.google_object_id.
 */
export async function createMembershipObject(memberId: string, initialOffers: NearbyOffer[]) {
  const authClient = await client()
  const { issuerId } = loadGoogleWalletCredentials()
  const objectId = `${issuerId}.member_${memberId}`

  await authClient.request({
    url: `${BASE_URL}/genericObject`,
    method: 'POST',
    data: {
      id: objectId,
      classId: classId(),
      state: 'ACTIVE',
      cardTitle: { defaultValue: { language: 'en', value: 'Jeeran Offers' } },
      header: { defaultValue: { language: 'en', value: 'Nearby deals for you' } },
      textModulesData: offersToTextModules(initialOffers),
      hexBackgroundColor: BRAND_NAVY,
      logo: { sourceUri: { uri: LOGO_URL } },
      heroImage: { sourceUri: { uri: HERO_IMAGE_URL } },
      // Persistent identity barcode — shop staff scan THIS to redeem
      // whichever of their own offers this member currently qualifies for.
      // Not tied to any single offer, since the pass rotates many over time.
      barcode: {
        type: 'QR_CODE',
        value: signMemberToken(memberId),
        alternateText: 'Show to redeem',
      },
    },
  })

  return objectId
}

/**
 * PATCHes an existing pass with a fresh offer list. This is what makes
 * offers "just appear" without the customer reopening anything — Google
 * pushes the card refresh, and the accompanying message can surface as a
 * notification.
 */
export async function patchMembershipObject(objectId: string, offers: NearbyOffer[]) {
  const authClient = await client()

  await authClient.request({
    url: `${BASE_URL}/genericObject/${objectId}`,
    method: 'PATCH',
    data: {
      // Self-heals cardTitle on any object that was created before this field
      // was correct (e.g. the pre-launch "[TEST ONLY] Jeeran Offers" objects —
      // see scripts/migrate-wallet-card-title.mjs for the one-time bulk fix;
      // this keeps any object patched going forward from drifting back).
      cardTitle: { defaultValue: { language: 'en', value: 'Jeeran Offers' } },
      textModulesData: offersToTextModules(offers),
      messages: offers.length
        ? [
            {
              header: 'New offer nearby',
              body: `${offers[0].business_name}: ${offers[0].offer_title}`,
              id: `offer-${offers[0].offer_id}-${Date.now()}`,
            },
          ]
        : [],
    },
  })
}

function offersToTextModules(offers: NearbyOffer[]) {
  return offers.slice(0, 2).map((o, i) => ({
    id: `nearby_${i + 1}`,
    header: o.business_name,
    body: `${o.offer_title} · ${o.distance_km.toFixed(1)} km`,
  }))
}
