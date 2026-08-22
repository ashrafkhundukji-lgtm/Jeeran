/**
 * Google Wallet — "Jeeran Offers" membership pass
 *
 * Replaces the one-pass-per-offer model with a single persistent Generic
 * pass per customer. We PATCH this object whenever nearby offers change,
 * which refreshes the card (patchMembershipObject) and, separately, can
 * push a lock-screen notification for whichever offer is actually new
 * (notifyNewOffer, via Google's dedicated addMessage endpoint).
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

// Google Wallet's LocalizedString type (used by cardTitle, header, and
// Message.localizedHeader/localizedBody) carries a defaultValue PLUS a
// translatedValues[] array — the Wallet app auto-picks whichever entry
// matches the viewer's own device/Google account language and falls back to
// defaultValue otherwise. This is resolved entirely client-side by Google;
// we don't need to know (and don't store) each customer's language — see
// https://developers.google.com/wallet/reference/rest/v1/LocalizedString.
// Only covers the fixed chrome text below (card title, section header,
// notification header) — offer titles/descriptions/business names are
// whatever a shop owner typed into the dashboard in whatever language they
// used, which this app has no mechanism to translate.
function localizedString(en: string, ar: string, ur: string) {
  return {
    defaultValue: { language: 'en', value: en },
    translatedValues: [
      { language: 'ar', value: ar },
      { language: 'ur', value: ur },
    ],
  }
}

// Same fixed-chrome-text-only translation as localizedString() above, plus
// an untranslated suffix appended identically across every language — for
// captions like offersToLinksModule()'s "View offer – {business_name}",
// where the prefix has real ar/ur translations but the suffix is dynamic
// shop content we have no translation for (same reasoning as offer_title
// elsewhere in this file).
function localizedStringWithSuffix(en: string, ar: string, ur: string, suffix: string) {
  return {
    defaultValue: { language: 'en', value: `${en}${suffix}` },
    translatedValues: [
      { language: 'ar', value: `${ar}${suffix}` },
      { language: 'ur', value: `${ur}${suffix}` },
    ],
  }
}

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

// Tried moving Directions/View offer to the top of the pass Details view via
// classTemplateInfo.detailsTemplateOverride (referencing linksModuleData.uris
// by fieldPath) — verified live that Google's API accepts it, and it does
// move the links up. But Google's own docs (offers-template reference) say
// plainly: "The fields are displayed with no label" for links pulled in this
// way — confirmed on a real device, both links rendered as unlabeled icons
// indistinguishable until tapped. Reverted: a customer risks opening Maps
// when they meant the offer page (or vice versa). Left at Google's default
// position (bottom of the Details view) instead, where Directions/View offer
// keep their actual text captions from offersToLinksModule()'s
// localizedDescription — buried is better than ambiguous.
//
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
  business_lat: number
  business_lng: number
  // Campaign row's updated_at (auto-maintained by a Postgres trigger — see
  // supabase/migrations/20260817b_offer_content_versioning.sql). Lets
  // refreshMember() (geo-notify.ts) detect a same-offer content edit
  // (title/description/bid too small to reorder) as "changed," which a
  // plain offer_id-set diff can't see.
  offer_updated_at: string
  // Optional photo a shop attaches to their own campaign — see
  // supabase/migrations/20260819_campaign_images.sql. Null for most offers;
  // offersToImageModules() below skips the field entirely rather than
  // sending an empty/placeholder image when unset.
  offer_image_url: string | null
}

// OS-level geofencing: Google Wallet compares the phone's live GPS against
// these points itself and surfaces the pass on the lock screen when nearby —
// no server-side location tracking, no app. This is what actually delivers
// "offers follow the customer"; home_lat/home_lng (wallet_members) only ever
// seeds the initial nearby-offers list and the server-side push radius — see
// the column comments added in
// supabase/migrations/20260817_nearby_offers_locations.sql.
//
// Capped at 10 — Google's documented limit for genericObject.merchantLocations
// (the field is `merchantLocations`, NOT `locations` — that name belongs to
// the older, deprecated LatLongPoint mechanism this replaces; verified
// against a live PATCH, which 400s if you send `locations` here — Google
// silently drops the unrecognized field rather than erroring on the field
// name itself, so the failure just shows up as "Patch request was empty").
// In practice this list is already whatever nearby_active_offers() returned
// (callers pass p_limit: 5), so the slice is defensive, not the binding
// constraint; fewer than 10 offers just means fewer location points, which
// is fine.
//
// Apple's .pkpass has the equivalent concept, and there the field genuinely
// is called `locations` (pass.json, same 10-point cap, resolved by iOS the
// same on-device way) — see the already-shipped one-off flow's
// pass.setLocations() call in src/lib/wallet/buildPass.ts for the
// passkit-generator API shape. No Apple membership-pass builder exists yet
// (only apple_pass_serial's column, no per-member .pkpass generation code) —
// when one's built, populate its `locations` from this same NearbyOffer[]
// the way this file does for Google, rather than re-deriving it from
// scratch. Don't copy the field name across platforms.
function offersToMerchantLocations(offers: NearbyOffer[]) {
  return offers.slice(0, 10).map((o) => ({
    latitude: o.business_lat,
    longitude: o.business_lng,
  }))
}

// Enriches the card beyond plain text using Google Wallet's real
// imageModulesData/linksModuleData fields (verified against a live PATCH
// before shipping — see google-membership-pass.test note below) — plus a
// per-offer landing page (src/app/offers/[campaignId]/page.tsx) for the
// fuller experience the card's fixed template can't provide on its own.
//
// imageModulesData stays scoped to the single TOP-ranked offer only
// (offers[0]) — deliberately not one image per offer, to keep the card
// respectful rather than turning it into a cluttered ad unit (a shop photo
// per row would dominate the card). linksModuleData is NOT similarly capped
// to one offer — see offersToLinksModule()'s own comment for why that one
// covers every offer actually shown in textModulesData instead.
//
// Both draw from the same MAX_OFFERS_SHOWN cap as textModulesData
// (offersToTextModules below) so a link can never reference an offer the
// card's text never mentions, and vice versa. Exported so
// src/app/offers/nearby/page.tsx (the "Other offers nearby" link's target —
// see offersToLinksModule below) can skip exactly the offers already shown
// on the card instead of hardcoding a second copy of this number.
export const MAX_OFFERS_SHOWN = 2

// Image is the shop's own optional upload (campaigns.image_url) — most
// offers won't have one. Returns [] (not undefined) when there's no image to
// show: confirmed live via a direct genericObject GET that a PATCH omitting
// a repeated-field key entirely (what `undefined` produces once
// patchMembershipObject's request body is JSON-serialized) leaves Google's
// STORED value untouched, not cleared — unlike textModulesData/
// merchantLocations, which are always sent as a real array (possibly empty)
// and do clear correctly. Concretely: the top offer's image was going stale
// and staying pinned to the card indefinitely once that offer stopped being
// #1 (a later PATCH for a new #1 offer with no image of its own silently
// left the old image in place) — this looked exactly like "the offer with an
// image always shows in the top slot," when the actual bug was staleness,
// not the ranking itself (nearby_active_offers() never sorts on image
// presence — see that function's ORDER BY). contentDescription uses the
// offer's own title as-is, not run through localizedString() — that helper
// is for FIXED chrome text we actually have ar/ur translations for; offer
// content is whatever language the shop typed, same reasoning already
// documented for textModulesData.
function offersToImageModules(offers: NearbyOffer[]) {
  const top = offers[0]
  if (!top?.offer_image_url) return []
  return [
    {
      id: 'offer_image',
      mainImage: {
        sourceUri: { uri: top.offer_image_url },
        contentDescription: { defaultValue: { language: 'en', value: top.offer_title } },
      },
    },
  ]
}

// ONE tap target per offer actually shown in textModulesData
// (MAX_OFFERS_SHOWN, currently the top 2) — each opens that offer's landing
// page (src/app/offers/[campaignId]/page.tsx), which is now the real hub:
// Directions, Call, and WhatsApp all live there instead of as separate
// Wallet-card link rows. Deliberately NOT one row per action per offer
// (View + Directions + Call + WhatsApp × 2 offers = 8 rows) — Wallet's
// linksModuleData is a flat, uncategorized list with no per-offer grouping
// UI of its own, so that many rows reads as clutter, not choice, and only
// gets worse as more actions get added later (delivery, etc.). The browser
// page has actual layout to work with; the card doesn't. Kept at Google's
// default bottom-of-Details-view position rather than pulled up via
// classTemplateInfo.detailsTemplateOverride — see the comment on that
// attempt near the top of this file: links moved that way lose their text
// captions on a real device, which would make even a single-row-per-offer
// list ambiguous. Each caption is suffixed with the offer's own
// business_name (not run through localizedString() itself — same reasoning
// as offer content elsewhere in this file: it's whatever the shop typed, not
// something we have ar/ur translations for) so two offers on one card never
// present two identically-captioned "View offer" links.
//
// Falls back to a plain "Directions" link per offer ONLY when
// NEXT_PUBLIC_APP_URL isn't configured (so there's still something tappable
// rather than nothing) — same guard buildSaveUrl already uses. In the normal
// configured case this is the only fallback the card needs; Directions for
// the top offer is one tap away via the landing page's own button, which is
// safe to link to for any offer nearby_active_offers() returns (its own
// WHERE clause requires businesses.geog non-null, so business_lat/lng can't
// be null here either, for the fallback path). Link type is inferred by
// Google from the URI scheme (https:// / geo:), not a separate field —
// confirmed against the Uri reference.
// Returns { uris: [] } (not undefined) when there's nothing to show at all —
// same staleness reasoning as offersToImageModules() just above: an
// omitted key leaves Google's stored linksModuleData untouched on PATCH, so
// a member whose nearby-offers list ever goes empty (moved out of every
// offer's range, say) would otherwise keep stale links pointing at whatever
// offer(s) were last shown, forever.
//
// A trailing "Other offers nearby" link is appended when the offers list
// nearby_active_offers() returned actually has more than what's shown on the
// card (MAX_OFFERS_SHOWN) — omitted otherwise so it's never a dead-end
// button. It opens src/app/offers/nearby/page.tsx, which does its OWN fresh,
// higher-limit nearby_active_offers() query rather than being bounded by
// however many rows got embedded on the card at last patch time — this
// `offers` array only ever has up to 5 (every caller passes p_limit: 5), so
// treating it as authoritative for "is there more" would undercount once a
// dense area has >5 active campaigns. Identifies the member via
// signMemberToken() (same signing already used for the barcode) rather than
// a raw memberId or raw lat/lng in the URL — keeps both out of a link that
// can end up in browser history/referrers, and the target page verifies it
// server-side the same way /api/redeem already does for the barcode.
function offersToLinksModule(memberId: string, offers: NearbyOffer[]) {
  const shown = offers.slice(0, MAX_OFFERS_SHOWN)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  const uris = shown.map((o, i) => {
    const n = i + 1
    const suffix = shown.length > 1 ? ` – ${o.business_name}` : ''

    if (appUrl) {
      return {
        id: `view_offer_${n}`,
        uri: `${appUrl}/offers/${o.offer_id}`,
        description: `View offer${suffix}`,
        localizedDescription: localizedStringWithSuffix('View offer', 'عرض التفاصيل', 'آفر دیکھیں', suffix),
      }
    }

    return {
      id: `directions_${n}`,
      uri: `https://www.google.com/maps/dir/?api=1&destination=${o.business_lat},${o.business_lng}`,
      description: `Directions${suffix}`,
      localizedDescription: localizedStringWithSuffix('Directions', 'الاتجاهات', 'راستہ دیکھیں', suffix),
    }
  })

  if (appUrl && offers.length > MAX_OFFERS_SHOWN) {
    uris.push({
      id: 'other_offers',
      uri: `${appUrl}/offers/nearby?token=${signMemberToken(memberId)}`,
      description: 'Other offers nearby',
      localizedDescription: localizedString('Other offers nearby', 'عروض أخرى قريبة منك', 'قریب دیگر آفرز'),
    })
  }

  return { uris }
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
      cardTitle: localizedString('Jeeran Offers', 'عروض جيران', 'جیران آفرز'),
      header: localizedString('Nearby deals for you', 'عروض قريبة منك', 'آپ کے قریب آفرز'),
      textModulesData: offersToTextModules(initialOffers),
      merchantLocations: offersToMerchantLocations(initialOffers),
      imageModulesData: offersToImageModules(initialOffers),
      linksModuleData: offersToLinksModule(memberId, initialOffers),
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
 * PATCHes an existing pass with a fresh offer list — card content only
 * (title/rows/geofence points). This is what makes the card itself update
 * without the customer reopening anything. Does NOT trigger a lock-screen
 * notification on its own; see notifyNewOffer() below for that — they used
 * to be combined here (a `messages` array on this same PATCH, no
 * `messageType`), which a real-device test showed updates the card with no
 * notification ever appearing. Confirmed against Google's docs: a message
 * only becomes an Android notification with `messageType: TEXT_AND_NOTIFY`,
 * set on a Message sent through the dedicated addMessage endpoint — not by
 * embedding an untyped `messages` array in a general object PATCH like this.
 */
export async function patchMembershipObject(objectId: string, memberId: string, offers: NearbyOffer[]) {
  const authClient = await client()

  await authClient.request({
    url: `${BASE_URL}/genericObject/${objectId}`,
    method: 'PATCH',
    data: {
      // Self-heals cardTitle on any object that was created before this field
      // was correct (e.g. the pre-launch "[TEST ONLY] Jeeran Offers" objects —
      // see scripts/migrate-wallet-card-title.mjs for the one-time bulk fix;
      // this keeps any object patched going forward from drifting back).
      // Also re-sends header for the same reason: objects created before
      // localizedString() existed only ever got the English-only
      // defaultValue, with no translatedValues — resending it here backfills
      // ar/ur for those on their next refresh instead of leaving them stuck.
      cardTitle: localizedString('Jeeran Offers', 'عروض جيران', 'جیران آفرز'),
      header: localizedString('Nearby deals for you', 'عروض قريبة منك', 'آپ کے قریب آفرز'),
      textModulesData: offersToTextModules(offers),
      // Rides the same trigger as textModulesData above (campaign
      // activate/deactivate, periodic sweep) — no separate update path.
      // See offersToMerchantLocations() for why this is what actually makes
      // offers "follow" the customer, not home_lat/home_lng.
      merchantLocations: offersToMerchantLocations(offers),
      imageModulesData: offersToImageModules(offers),
      linksModuleData: offersToLinksModule(memberId, offers),
    },
  })
}

/**
 * Fires an actual lock-screen push notification for one genuinely NEW offer,
 * via Google's dedicated addMessage endpoint (POST .../genericObject/{id}/
 * addMessage — a separate call from patchMembershipObject's PATCH above).
 * `messageType: 'TEXT_AND_NOTIFY'` is what makes this show as an Android
 * notification rather than just card text; see Google's Message reference.
 *
 * Caller (refreshMember() in geo-notify.ts) is responsible for picking the
 * actual newly-appeared offer — this function doesn't infer "new" itself,
 * so don't just pass offers[0] (the current top-bid offer, which is often
 * NOT the one that just appeared — that was the previous, wrong behavior).
 *
 * Google caps this at 3 notification-triggering messages per object per 24h
 * (QuotaExceededException past that) — treat failures as best-effort, same
 * as the rest of the push pipeline; a throttled notify shouldn't undo the
 * card refresh that already succeeded via patchMembershipObject.
 *
 * header is localized (see localizedString()) since "New offer nearby" is
 * fixed chrome text; body isn't — it's the shop's own business_name/
 * offer_title, in whatever language they typed, which we have no
 * translation for. Keeping the plain `header` alongside `localizedHeader`
 * since Google's docs don't say whether localizedHeader alone is sufficient
 * or the plain field is still read as a fallback by some clients.
 */
export async function notifyNewOffer(objectId: string, offer: NearbyOffer) {
  const authClient = await client()

  await authClient.request({
    url: `${BASE_URL}/genericObject/${objectId}/addMessage`,
    method: 'POST',
    data: {
      message: {
        header: 'New offer nearby',
        localizedHeader: localizedString('New offer nearby', 'عرض جديد بالقرب منك', 'قریب نیا آفر'),
        body: `${offer.business_name}: ${offer.offer_title}`,
        id: `offer-${offer.offer_id}-${Date.now()}`,
        messageType: 'TEXT_AND_NOTIFY',
      },
    },
  })
}

function offersToTextModules(offers: NearbyOffer[]) {
  return offers.slice(0, MAX_OFFERS_SHOWN).map((o, i) => ({
    id: `nearby_${i + 1}`,
    header: o.business_name,
    body: `${o.offer_title} · ${o.distance_km.toFixed(1)} km`,
  }))
}
