# Samsung Wallet Integration — Technical Comparison & Plan

**Status:** Planning only. No integration code written, no Samsung credentials held.
**Purpose:** map what's already built for Google Wallet (`src/lib/wallet/google-membership-pass.ts`,
`src/lib/wallet/geo-notify.ts`) onto Samsung Wallet's public API model, so there's a concrete plan
ready the moment Partner Portal approval comes through.
**Sources:** Samsung's public developer docs only (`developer.samsung.com/wallet/...` + the official
dev blog). No Partner Portal access, no test credentials — several items below are marked
**Unconfirmed** for exactly that reason and need a real portal login to settle, not more reading.

---

## 1. The headline difference: push vs. pull-on-notify

This is the one architectural fact that shapes everything else, so it goes first.

**Google Wallet (what we have today):** fully outbound. Jeeran's server calls Google's REST API
whenever it wants — `PATCH /genericObject/{id}` with the complete new state, and Google applies it.
Google never calls Jeeran. Every route in `src/app/api/wallet/google/` and `google-membership-pass.ts`
is Jeeran-initiated; there is no inbound webhook surface at all today.

**Samsung Wallet: partner-hosted data, pulled on notify.** Samsung does not accept pushed content.
Instead:

1. Jeeran's server is expected to **host the card data itself** and serve it from a **Get Card Data**
   endpoint Samsung calls: `GET {partner server}/cards/{cardId}/{refId}`.
2. When Jeeran changes an offer, it does **not** send the new content anywhere. It calls Samsung's
   **Update Notification** API — `POST {cc2}/wltex/cards/{cardId}/updates` — which just says "this
   card is stale, go re-fetch it."
3. Samsung's server then calls back into **Jeeran's** Get Card Data endpoint to pull the fresh
   content, and pushes it to the device.
4. Samsung also calls a separate **Send Card State** webhook — `POST {partner server}/cards/{cardId}/{refId}`
   — whenever a card's state changes on a user's device (`ADDED`, `UPDATED`, `DELETED`), which is how
   Jeeran learns a save actually happened and gets the `refId` needed for later calls.

Concretely: **Jeeran would need to stand up and operate two new inbound API routes that don't exist
in any form today** — a Get Card Data handler and a Send Card State webhook receiver, both
authenticated by verifying Samsung's signed JWT against a Samsung-issued certificate. Every other
piece of new work in this document is smaller than this one.

| | Google Wallet (today) | Samsung Wallet |
|---|---|---|
| Who calls whom | Jeeran → Google only | Both directions |
| Content storage | Google stores the object; Jeeran PATCHes it | **Jeeran stores/serves the content**; Samsung pulls it |
| Update trigger | Direct PATCH with full new content | "Ping" that content changed; Samsung fetches it separately |
| New inbound surface needed | None | Get Card Data (GET) + Send Card State (POST webhook), both JWT-verified |

---

## 2. Card content field mapping

Jeeran's Google object is a single persistent **Generic** pass per member (`createMembershipObject` /
`patchMembershipObject` in `google-membership-pass.ts`). The nearest Samsung card type is **Loyalty**
(persistent, per-customer, provider-branded) — not Coupon, which is closer to a single-use
per-offer voucher and doesn't fit Jeeran's "one card, rotating nearby offers" model.

| Jeeran field (Google) | Samsung Loyalty field | Fit | Notes |
|---|---|---|---|
| `cardTitle` ("Jeeran Offers") | `providerName` | Clean | Brand/issuer line |
| `header` ("Nearby deals for you") | `title` | Clean | Main headline |
| `hexBackgroundColor` | `bgColor` | Clean | Hex, same shape |
| `logo` | `logoImage` | Clean — **richer** | Samsung natively splits `logoImage.lightUrl` / `.darkUrl`; Google's card auto-adapts, ours never had a per-theme logo. Minor upgrade if we build it. |
| `heroImage` | `bgImage` | Mostly clean | Samsung specs an exact recommended size (888×555px) where Google's is more forgiving — asset needs a resize pass, not new art |
| `barcode` (QR, member token) | `barcode.value` + `.ptFormat`/`.ptSubFormat` + `.serialType` | Clean | 1:1, same QR mechanism |
| `textModulesData` (`nearby_1`/`nearby_2` — two dynamic offer rows via `cardRowTemplateInfos.twoItems`) | No direct equivalent | **Gap — Unconfirmed** | Loyalty's per-instance fields are a fixed set (`title`, `subtitle1`, `level`, …), not an arbitrary list like Google's `textModulesData`. `extendedFields` ("flexible list of key-value pairs") is the only candidate, but whether the Partner Portal template designer can actually *render* those as visible rows — vs. them being metadata-only — isn't stated in public docs. This is the field that carries Jeeran's actual product (which 2 offers are nearby), so it's worth confirming first once portal access exists. |
| `imageModulesData` (per-offer campaign photo) | Possibly `bgImage`, per-instance | **Unconfirmed** | Docs don't say whether `bgImage` is template-fixed (set once, same art for every customer) or instance-overridable per card. If it's template-fixed, Jeeran loses per-offer photos entirely on this platform. |
| `linksModuleData` (`View offer` + `Directions`, arbitrary URI list) | `appLinkData`/`appLinkName`/`appLinkLogo` (one app link) + `summaryUrl` (one webpage link) | **Partial** | Google's list-of-URIs (any count, any scheme — `https:`, `geo:`) has no Samsung equivalent. Realistic mapping: `summaryUrl` → View offer page; `Directions` (a `geo:` link today) has nowhere clean to go — likely folds into `noticeDesc` (HTML-supported free text) as a plain link, losing the distinct tappable-icon treatment Google gives it. |
| `merchantLocations` (OS-level geofencing — see §3) | `locations` ("list of locations where the card can be used") | **Unconfirmed, likely a gap** | See §3 — this is the important one. |
| N/A (Google has no per-theme photo) | `idPhoto` | — | No use for Jeeran; this is a member-photo field for ID-style loyalty cards |

**Net read on content:** the *branding* fields (title, colors, logo, hero, barcode) map cleanly and
are low-risk. The fields that carry Jeeran's actual live product — which two offers are showing, each
offer's photo, and the offer/directions links — either have no confirmed equivalent or degrade
meaningfully. None of this blocks starting integration work, but it does mean the card's visual
richness on Samsung will likely look plainer than the Google version until (or unless) `extendedFields`
turns out to render as real content.

---

## 3. Geofencing / "offers follow the customer" — the biggest open question

This is Jeeran's actual mechanic, not a nice-to-have: `merchantLocations` on the Google object is
what makes the OS itself compare the phone's live GPS against up to 10 business locations and surface
the card on the lock screen — no server-side tracking, no app, per the comment already in
`google-membership-pass.ts`.

Samsung's Loyalty spec has a `locations` field described only as **"List of locations where the card
can be used."** Every public page found describes Samsung Wallet's on-device surfacing (Quick Access,
swipe-up) as a **manual gesture**, not automatic proximity triggering. Nothing in Samsung's public
docs confirms `locations` does anything beyond displaying a branch-address list on the card details
screen.

**This could not be resolved by reading — it needs Partner Portal access or a direct question to
Samsung dev relations.** Flagging it first, plainly, rather than assuming either answer:

- If `locations` **does** drive OS-level proximity surfacing: the mechanic ports over close to 1:1.
- If it **doesn't**: Jeeran's core "offers follow you, no need to reopen anything" value prop has no
  Samsung equivalent at all, and the fallback would be leaning entirely on the Send Notification API
  (§4) — which has its own real constraints — or accepting that Samsung members only see updated
  offers when they manually open the card.

Given how central this mechanic is, this is the single item worth confirming earliest once portal
access exists — before investing in any other part of the integration.

---

## 4. Push notifications: freeform vs. pre-approved templates

Google's `notifyNewOffer()` sends arbitrary text at send-time — `header`/`body` built directly from
whatever a shop owner typed (`${offer.business_name}: ${offer.offer_title}`) — via `addMessage` with
`messageType: TEXT_AND_NOTIFY`, capped at Google's documented 3-per-object/24h limit (already the
whole reason `sendDailyNotificationBatch()` exists — see `geo-notify.ts`).

Samsung's **Send Notification API** (`POST {cc2}/wltex/cards/{cardId}/notifications/{templateId}/send`)
is **template-gated**: partners must create and get a message template *pre-approved* through the
Partner Portal, then fill `{{placeholder}}` variables at send-time via the `data` field — closer to
WhatsApp Business API's template model than to Google's freeform send.

**Consequence for Jeeran:** the current code path (`business_name`, `offer_title` typed by any shop
owner, sent as-is) can't port directly — Samsung requires the *shape* of the message to be
pre-approved, not just the variables. Realistic plan: register one generic template early
(something like `"New offer nearby: {{business}} — {{offer}}"`), pass `business_name`/`offer_title`
as the two variables, and treat that template as fixed going forward — shop owners still control the
values, just not the surrounding sentence.

**Rate limits:** not found anywhere in Samsung's public docs — no stated per-day or per-object cap
comparable to Google's. **Marking this Unconfirmed rather than "unlimited"** — the absence of a
documented limit isn't proof one doesn't exist operationally; needs a direct check once there's a
live template to test against.

`refIds` (an array, addressing specific issued card instances) is the closest thing to Google's single
`objectId` target — structurally fine, no gap there.

---

## 5. Update flow, end to end (concrete sequence)

Restating §1 as the actual sequence, since it's the part requiring new infrastructure:

1. Shop owner activates/edits a campaign → today, `notifyMembersNearBusiness()` fires immediately.
2. **Google path (exists):** for each nearby member, `patchMembershipObject()` PATCHes the full new
   state straight to Google. Done.
3. **Samsung path (all new):**
   a. Jeeran updates its *own* stored copy of that member's card data (a new table/store — today
      nothing persists "current card content," it's recomputed fresh from `nearby_active_offers()` on
      every refresh and hasn't needed a durable copy because Google's PATCH is stateless from Jeeran's
      side).
   b. Jeeran calls Samsung's Update Notification endpoint for that member's `refId`.
   c. Samsung calls back into Jeeran's Get Card Data endpoint, which serves the data from (a).
   d. Samsung pushes the refreshed card to the device.

Step 3a is a real, non-trivial addition: **the Google integration has never needed to persist
"what does this member's card currently say" anywhere** — it's derived on demand and handed to Google
directly. A Samsung integration turns Jeeran into the system of record for card content, servable
on request, which is a genuinely different responsibility than anything the wallet code does today.

---

## 6. Card template lifecycle

**Google:** `ensureMembershipClass()` is a plain idempotent REST call — GET-then-create, runs before
every registration, fully self-service from code, no manual step, ever (see the comment in
`google-membership-pass.ts` about why it's cheap to call every time).

**Samsung:** templates are created and configured through the **Partner Portal UI** (visual layout,
card type/subtype, operational flags) and move through explicit states: `VERIFYING` → `ACTIVE` →
(`BLOCKED` on Samsung's side only). Docs mention an **Update API** for transitioning
`VERIFYING`→`ACTIVE`, so *some* of this is API-reachable — but whether a template can be **created**
from scratch via API, or only edited-then-approved through the portal, isn't stated. **Unconfirmed**
— matters for whether template setup is a one-time manual portal task or something that could
eventually be scripted alongside `ensureMembershipClass()`'s pattern.

One hard constraint either way: **"cannot be reverted to a previous state" once `ACTIVE`** — layout
changes need more care than Google's class updates, which are just another idempotent PATCH.

---

## 7. Auth model

**Google (built, working):** service-account JSON key (`GOOGLE_WALLET_SERVICE_ACCOUNT_KEY_B64`) →
OAuth2 via `google-auth-library`, straightforward, already in production (`google-membership-pass.ts`
`client()`). Separately, save-URLs are a hand-rolled RS256 JWT signed directly with the private key
via `node:crypto`'s `createSign` (`signRS256Jwt()` in `google.ts`) — no library needed for that half.

**Samsung:** CSR-based. Partner uploads a Certificate Signing Request during onboarding; Samsung signs
it and returns a certificate + `certificateId`. Every server API call — both directions — is
authenticated by a **partner-signed JWT** (RS256, header carries `partnerId`/`certificateId`/`utc`
timestamp, payload carries the API path + method + `refId`), verified using Samsung's public
certificate. This is a **direct-signing, mutual-auth model**, not OAuth2's token-issuance step —
structurally closer to Jeeran's *existing* `signRS256Jwt()` hand-rolled signer than to the
`google-auth-library` OAuth2 flow. **That's a real, concrete piece of reusable infrastructure**: the
save-URL JWT signer already in `google.ts` is architecturally the right shape to adapt for Samsung's
request signing — same primitive (RS256, private key, `createSign`), different header/payload
contents and a certificate to manage instead of a service-account key.

`cc2` (seen throughout Samsung's docs) is a **2-letter ISO country code** used for regional request
routing, both as a path segment and an `x-smcs-cc2` header — not a content identifier. (Worth stating
plainly since early-pass reading of the docs can misread it as one — the string shows up in enough
different endpoint paths that it's easy to conflate with `refId`.)

---

## 8. Summary: clean vs. genuinely different

**Maps cleanly, low risk:**
- Barcode/QR (member token, same mechanism)
- Background color, logo, hero image (asset-dimension adjustments only)
- Card title / header / provider name
- Notification *targeting* (`refIds` array ≈ Google's single `objectId`)
- JWT request-signing primitive (existing `signRS256Jwt()` is the right starting point)

**Needs genuinely different implementation:**
- **The entire update mechanism** — push-with-full-payload (Google) vs. partner-hosted-content +
  pull-on-notify (Samsung). Requires two new inbound, JWT-verified API routes and a new durable store
  for "current card content per member" that doesn't exist today.
- **Push notification content** — freeform (Google) vs. pre-approved template + variables (Samsung).
- **The two-offer dynamic text layout** — Google's `cardRowTemplateInfos.twoItems` has no confirmed
  Samsung equivalent; depends on how `extendedFields` actually renders.
- **Per-offer campaign photos** — depends on whether `bgImage` is instance-overridable.
- **Multiple links (View offer + Directions)** — Samsung supports at most one clean link field.

**Unconfirmed — needs Partner Portal access, not more reading:**
- Whether `locations` drives any OS-level proximity surfacing at all (§3 — the most important unknown)
- Whether `extendedFields` renders visibly or is metadata-only
- Whether `bgImage` is per-instance or template-fixed
- Send Notification API rate limits
- Whether card templates can be created via API or only through the portal UI

---

## 9. Suggested order of operations once approved

Not a build plan — just the order these open questions should get resolved in, since several later
decisions depend on the answers:

1. Confirm the `locations` behavior (§3) first — it determines whether Samsung is worth building the
   full integration for, or whether it'd ship as a strictly-worse "offers only refresh when you open
   the card" experience.
2. Confirm `extendedFields` rendering and `bgImage` per-instance support (§2) — determines how close
   the Samsung card can get to visual parity with the Google one.
3. Register and get approval for the notification template (§4) early — Samsung's approval step adds
   lead time the other work doesn't have.
4. Only then scope the two new inbound routes (§1/§5) and the new "current card content" store —
   by far the largest net-new engineering surface, and not worth designing in detail until 1–3 confirm
   what content model it actually needs to serve.

---

*No code written against this plan. All findings sourced from public Samsung developer documentation
as of 2026-08-20; several items explicitly marked Unconfirmed pending real Partner Portal access.*
