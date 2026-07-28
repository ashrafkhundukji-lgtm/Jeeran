# Jeeran Network — Use Cases & Test Plan

Generated from a full read of the codebase (routes, lib, migrations) as of 2026-07-20.
Environment note: this project is pre-launch — the Supabase project currently in use
will be wiped before go-live, so tests in this plan run directly against it (no
staging branch needed).

Two features are currently **unconfigured** in this environment (no credentials
set) and cannot execute their happy path yet:
- **Stripe billing** — no `STRIPE_SECRET_KEY`. Checkout/webhook routes fail
  cleanly with a `StripeNotConfiguredError` (501). Happy-path scenarios are
  documented below for when a test-mode key is added.
- **Email (SMTP)** — no `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS`/`SMTP_FROM`. The
  trial-warning cron fails cleanly with `EmailNotConfiguredError` (501) if any
  shop is actually due. Happy-path documented for when SMTP is added.
- **Apple Wallet** — no signer cert/key configured. One-off Apple pass
  generation fails cleanly with `WalletNotConfiguredError` (501).

Status legend: ✅ Executable now · 🚫 Blocked (not configured) · 📄 Documented only

---

## A. Authentication & Onboarding

### UC-A1 — Sign up new business owner ✅
- **Preconditions:** Fresh email not already registered.
- **Input:** `POST` via `/signup` form — `email`, `password` (≥6 chars).
- **Expected output:** Supabase Auth account created. If email confirmation is
  required, page shows confirmation notice; otherwise redirects to `/dashboard`
  (which then redirects to `/dashboard/onboarding` since no business exists yet).

### UC-A2 — Sign up with an already-registered email ✅
- **Input:** Same email as an existing account.
- **Expected output:** Error shown inline on the signup form (Supabase Auth's
  "User already registered" message or equivalent); no new account created.

### UC-A3 — Sign up with a short password ✅
- **Input:** Password < 6 characters.
- **Expected output:** Client-side `minLength={6}` blocks submission; if
  bypassed, Supabase Auth rejects with a validation error.

### UC-A4 — Login with correct credentials ✅
- **Input:** Registered email + correct password.
- **Expected output:** Redirects to `?redirect=` target or `/dashboard`.

### UC-A5 — Login with wrong password ✅
- **Input:** Registered email + wrong password.
- **Expected output:** Inline error, no redirect, no session created.

### UC-A6 — Login with unregistered email ✅
- **Input:** Email with no account.
- **Expected output:** Inline error (Supabase returns a generic invalid-credentials message, doesn't reveal whether the email exists).

### UC-A7 — Access `/dashboard` while unauthenticated ✅
- **Input:** Navigate to `/dashboard` with no session cookie.
- **Expected output:** Redirect to `/login`.

### UC-A8 — Sign out ✅
- **Preconditions:** Logged in.
- **Input:** Click "Sign out" (`SignOutButton`).
- **Expected output:** Session cleared; subsequent `/dashboard` visit redirects to `/login`.

### UC-A9 — Complete onboarding (happy path) ✅
- **Preconditions:** Logged in, no `businesses` row for this owner yet.
- **Input:** `POST /api/onboarding` — `{ fullName, businessName, category, latitude, longitude }`, all valid (category one of `cafe|salon|dry-clean|hardware|auto|other`).
- **Expected output:** `200 { success: true }`. `profiles` row upserted (`role: 'owner'`), `businesses` row inserted with `is_subscription_active` defaulting **true** (3-month trial) and `trial_ends_at = now() + 3 months`. Redirects to `/dashboard/owner`.

### UC-A10 — Onboarding with missing required fields ✅
- **Input:** `POST /api/onboarding` missing `fullName`, or missing `businessName`/`category`.
- **Expected output:** `400 { error: 'Name is required' }` or `400 { error: 'Business name and category are required' }`. No rows written.

### UC-A11 — Onboarding when a business already exists for this owner ✅
- **Preconditions:** Owner already completed onboarding once.
- **Input:** `POST /api/onboarding` again with valid data.
- **Expected output:** `500` — insert violates `businesses_owner_id_key` unique constraint (one business per owner, DB-enforced). *(Note: this isn't pre-checked client-side the way campaign activation is — worth flagging as a rough edge if this route is ever re-hit, e.g. back button after already onboarding.)*

### UC-A12 — `/dashboard` routing logic ✅
- **Case 1:** No business yet → redirect `/dashboard/onboarding`.
- **Case 2:** Business exists → redirect `/dashboard/owner`.

---

## B. Owner Dashboard

### UC-B1 — Owner dashboard metrics render ✅
- **Preconditions:** Logged in, onboarded.
- **Expected output:** Page shows business name/category, `SubscriptionBanner` (conditionally), 3 metric tiles (ad credits, scans hosted, customers acquired) sourced from `get_owner_metrics(business_id)`.

### UC-B2 — QR PNG generation ✅
- **Input:** `GET /api/qr/{business_id}`.
- **Expected output:** `200`, `Content-Type: image/png`, 512×512 PNG encoding `{NEXT_PUBLIC_APP_URL}/scan/{business_id}`.

### UC-B3 — QR PDF generation ✅
- **Input:** `GET /api/qr/{business_id}/pdf`.
- **Expected output:** `200`, `Content-Type: application/pdf`, print-ready card with logo, shop name (Arabic-shaped if the name is Arabic script), QR code.
- **UC-B3b — non-existent business_id:** `404 { error: 'Business not found' }`.

### UC-B4 — SubscriptionBanner visibility ✅
- **Case 1:** `is_subscription_active=false` → banner shows "subscription is inactive".
- **Case 2:** `is_subscription_active=true`, `ad_credits=0` → banner shows "out of ad credits".
- **Case 3:** active + credits > 0 → banner hidden.

---

## C. Campaign Management

### UC-C1 — Create campaign (happy path) ✅
- **Preconditions:** Logged in, onboarded, no other active campaign.
- **Input:** `POST /api/campaigns` — `{ title, description?, bid_per_view: 2..10 }`.
- **Expected output:** `200 { campaign }`, `is_active: true`. Triggers `notifyMembersNearBusiness` (best-effort, non-blocking) if the business has lat/lng.

### UC-C2 — Create campaign with out-of-range bid ✅
- **Input:** `bid_per_view` = 1 or 11.
- **Expected output:** `400 { error: 'bid_per_view must be between 2 and 10' }`.

### UC-C3 — Create a second campaign while one is already active ✅
- **Input:** `POST /api/campaigns` while an active campaign already exists for this creator.
- **Expected output:** `409 { error: 'You already have an active campaign — deactivate it before creating another.' }` — pre-checked in app code, backed by DB constraint `campaigns_one_active_per_creator`.

### UC-C4 — Reactivate a campaign while another is active ✅
- **Input:** `PATCH /api/campaigns/{id}` `{ is_active: true }` for a second, currently-inactive campaign, while a different campaign is active.
- **Expected output:** `409 { error: 'You already have another active campaign — deactivate it first.' }`.

### UC-C5 — Deactivate a campaign ✅
- **Input:** `PATCH /api/campaigns/{id}` `{ is_active: false }`.
- **Expected output:** `200 { success: true }`. No geo-push triggered (only activation triggers it).

### UC-C6 — Missing title on create ✅
- **Input:** `POST /api/campaigns` with empty/whitespace `title`.
- **Expected output:** `400 { error: 'Title is required' }`.

### UC-C7 — Unauthenticated campaign requests ✅
- **Input:** `POST`/`PATCH /api/campaigns*` with no session.
- **Expected output:** `401 { error: 'Not authenticated' }`.

### UC-C8 — PATCH a campaign not owned by the caller ✅
- **Input:** `PATCH /api/campaigns/{other_owner_campaign_id}`.
- **Expected output:** `404 { error: 'Campaign not found' }` (RLS silently filters the row, treated as not-found).

---

## D. Matchmaking / Scan Page (customer-facing, anonymous)

### UC-D1 — Scan a business with eligible ads ✅
- **Input:** `GET /scan/{business_id}` where ≥1 other business/technician has an active, funded, subscribed campaign not excluded by category/linkage.
- **Expected output:** Page renders host name + up to 3 ad cards (via `get_top_ads`), ranked by `bid_per_view desc`, then a time-bucketed random tiebreak.

### UC-D2 — Scan a business with no eligible ads ✅
- **Expected output:** "No offers nearby right now — check back later."

### UC-D3 — Scan a non-existent business_id ✅
- **Expected output:** `404` (Next.js `notFound()`).

### UC-D4 — Host's own campaign excluded from its own scan page ✅
- Business A has an active campaign; scanning A's own `business_id` never shows A's own ad.

### UC-D5 — Same-category business excluded ✅
- Business A (category `cafe`) has an active campaign; scanning another `cafe`'s page excludes A's ad (only same-category businesses are protected from each other — different category hosts CAN show it).

### UC-D6 — Technician campaign excluded from linked business ✅
- Technician T is `linked_business_id`-linked to business B; T's active campaign is excluded from B's scan page specifically (but can show elsewhere).

### UC-D7 — Insufficient-credit creator excluded ✅
- Creator's `ad_credits <= bid_per_view` → excluded from `get_top_ads` even though campaign row is `is_active`.

### UC-D8 — Inactive-subscription creator excluded ✅
- `is_subscription_active=false` → excluded regardless of credits/active flag.

### UC-D9 — Inactive campaign excluded ✅
- `is_active=false` → never appears.

---

## E. Wallet — Legacy One-off Passes

### UC-E1 — Apple Wallet one-off generate 🚫 (blocked, not configured)
- **Input:** `POST /api/wallet/generate` `{ campaign_id, host_business_id }`.
- **Expected output today:** `501 { error: 'Wallet signing is not configured' }` (`WalletNotConfiguredError` — no `WALLET_SIGNER_CERT_B64` etc.).
- **Note:** UI button still present (`SaveToWalletButton`'s Apple option) — will show this error to real users until Apple certs are configured.

### UC-E2 — Google Wallet one-off generate ✅
- **Input:** `POST /api/wallet/google/generate` `{ campaign_id, host_business_id }` for an active, funded campaign + valid host.
- **Expected output:** `200 { saveUrl, claimToken }` — a valid `https://pay.google.com/gp/v/save/{jwt}` URL. *(No UI entry point anymore — the scan page's Google button now goes through the membership flow instead (soft cutover). Still reachable directly and still fully functional.)*

### UC-E3 — Wallet callback records the ad-credit claim ✅
- **Input:** `POST /api/wallet/callback` `{ campaign_id, host_business_id, claim_token }` (a valid, freshly-minted UUID from E2).
- **Expected output:** `200 { success: true, creditsTransferred }` — calls `claim_ad_credit_transaction`, moves `bid_per_view` credits from creator to host, inserts a `scans_and_claims` row.
- **UC-E3b — replayed claim_token:** second call with the same token → `409` ("already redeemed"-equivalent / insufficient — actually re-check: claim_ad_credit_transaction doesn't check for existing claim_token reuse itself, `/api/validate` is what checks `is_redeemed`; calling `/api/wallet/callback` twice with the same token would actually insert a SECOND `scans_and_claims` row with the same claim_token, violating the `unique` constraint on `claim_token` → `500` from the DB unique-violation.)

---

## F. Wallet — Membership Pass (geo-push, new)

### UC-F1 — First-time device creates a membership pass ✅
- **Preconditions:** No `device_id` cookie, no matching `wallet_members` row.
- **Input:** `POST /api/wallet/membership/create` `{ businessId, lat, lng }`.
- **Expected output:** `200 { alreadyMember: false, saveUrl }`. New `wallet_members` row (`device_id`, `origin_business_id`, `home_lat/lng`, `google_object_id` set). Sets `jeeran_device_id` httpOnly cookie (2yr). Google Wallet class+object created via REST.

### UC-F2 — Returning device reuses the existing pass ✅
- **Preconditions:** `jeeran_device_id` cookie already matches a `wallet_members` row.
- **Input:** Same route, same cookie.
- **Expected output:** `200 { alreadyMember: true, saveUrl }` (rebuilt from the stored `google_object_id`). No new row inserted.

### UC-F3 — No geolocation, business has coordinates ✅
- **Input:** `{ businessId }` only (no `lat`/`lng`).
- **Expected output:** Falls back to the business's own `latitude`/`longitude` as `home_lat`/`home_lng`.

### UC-F4 — No geolocation, business has no coordinates ✅
- **Expected output:** `400 { error: 'could not resolve a fallback location' }`.

### UC-F5 — Missing/invalid businessId ✅
- **Expected output:** `400 { error: 'businessId required' }` (missing) or `404 { error: 'business not found' }` (nonexistent).

### UC-F6 — Google Wallet callback: save event ✅
- **Input:** `POST /api/wallet/google/callback` with a signed JWT whose `eventInfo` includes `{ objectId: '{issuer}.member_{id}', eventType: 'save' }`.
- **Expected output:** `wallet_members.google_object_id` updated for that member.
- **Note:** requires a *genuinely* Google-signed JWT to pass `verifySignedJwtWithCertsAsync` — not easily forgeable for a test, so this is best verified by watching real Google Wallet app save/delete events, or documented as integration-only.

### UC-F7 — Google Wallet callback: delete event 📄 (same caveat as F6)
- **Expected output:** `google_object_id` cleared for the member matching that objectId.

### UC-F8 — Geo-push on campaign activation ✅
- **Preconditions:** ≥1 `wallet_members` row within `push_radius_km` (default 5) of the activating business, with `google_object_id` set.
- **Input:** Activate a campaign for that business (UC-C1 or UC-C4).
- **Expected output:** `nearby_active_offers` recomputed for each in-range member; if the offer set changed, `patchMembershipObject` PATCHes the Wallet object and `offer_notifications` gets a new row per (member, offer).
- **Note:** the actual Wallet PATCH call is a real Google API call — verifiable via the Wallet object's `textModulesData` afterward, or by checking `offer_notifications`/`wallet_members.last_notified_*` in the DB.

### UC-F9 — nearby_active_offers is platform-wide, not origin-scoped ✅
- Member recruited by business A, but a campaign from unrelated business B (business-only, in radius) still appears — confirms `origin_business_id` never filters (per the explicit design safeguard).

---

## G. Redemption

### UC-G1 — Legacy `/validate`: successful redemption ✅
- **Preconditions:** A `scans_and_claims` row with a known `claim_token`/`hash`, `is_redeemed=false`, campaign creator = logged-in business owner.
- **Input:** `POST /api/validate` `{ claim, hash }` (business owner session).
- **Expected output:** `200 { success: true, title }`. Row flips `is_redeemed=true`.

### UC-G2 — Legacy `/validate`: already redeemed ✅
- **Input:** Same claim/hash again.
- **Expected output:** `409 { error: 'This coupon has already been redeemed' }`.

### UC-G3 — Legacy `/validate`: tampered hash ✅
- **Input:** Valid `claim`, wrong `hash`.
- **Expected output:** `400` signature verification failure.

### UC-G4 — Legacy `/validate`: wrong business tries to redeem ✅
- **Input:** Valid claim/hash, but caller's business ≠ campaign creator.
- **Expected output:** `403 { error: 'This coupon does not belong to your business' }`.

### UC-G5 — New `/api/redeem`: successful redemption ✅
- **Preconditions:** Member has a valid signed barcode; scanning business has an active campaign; member hasn't redeemed that offer yet.
- **Input:** `POST /api/redeem` `{ barcodeValue }` (staff/business session).
- **Expected output:** `200 { ok: true, offer }`. `redemptions` row inserted; `claim_ad_credit_transaction_membership` runs (credits move from redeeming business → member's `origin_business_id`, unless self-recruited).

### UC-G6 — New `/api/redeem`: invalid/tampered barcode ✅
- **Expected output:** `400 { error: 'invalid or tampered barcode' }`.

### UC-G7 — New `/api/redeem`: no active offer for scanning business ✅
- **Expected output:** `404 { error: 'no active offer for this shop' }`.

### UC-G8 — New `/api/redeem`: already redeemed ✅
- **Input:** Same member+offer redeemed twice.
- **Expected output:** `409 { error: 'already redeemed by this customer' }` (checked pre-emptively, and DB unique constraint as a second guard).

### UC-G9 — New `/api/redeem`: self-recruited redemption ✅
- **Preconditions:** `wallet_members.origin_business_id` = the same business now redeeming.
- **Expected output:** Redemption still succeeds (`200`), but ad-credit transfer is a no-op (confirmed policy, see `claim_ad_credit_transaction_membership`).
- **Log convention:** RPC returns `credits_transferred: 0` in this case (and when there's no `origin_business_id` at all).

### UC-G10 — New `/api/redeem`: unauthenticated ✅
- **Expected output:** `401 { error: 'not authenticated as a business' }`.

---

## H. Dashboard / Admin Analytics

### UC-H1 — `/api/dashboard/redemptions` happy path ✅
- **Preconditions:** Logged in as a business owner.
- **Expected output:** `200 { summary, series, conversion }` from `business_redemption_summary`/`_timeseries`/`business_conversion_summary`.

### UC-H2 — `/api/dashboard/redemptions` unauthenticated ✅
- **Expected output:** `401`.

### UC-H3 — `/api/admin/redemptions` — always unauthorized ✅ (documented current gap)
- **Expected output:** `401` **regardless of caller** — `getIsAuthenticatedAdmin()` is a hardcoded `false` stub (no admin auth exists yet in the app). This is expected behavior today, not a bug to fix in this test pass — see prior session notes.

### UC-H4 — `/admin` page renders with no authentication ✅ (documented current gap)
- **Expected output:** Full shop list + aggregate stats visible to anyone with the URL — flagged as a known, pre-existing gap outside this test pass's scope.

---

## I. Billing (Stripe)

### UC-I1 — Checkout unauthenticated ✅
- **Expected output:** `401`.

### UC-I2 — Checkout with unknown price_id ✅
- **Expected output:** `400 { error: 'Unknown price_id' }`.

### UC-I3 — Checkout with no business account ✅
- **Expected output:** `404 { error: 'No business account found for this user' }`.

### UC-I4 — Checkout, valid request, Stripe not configured 🚫
- **Expected output today:** `501 { error: 'Billing is not configured' }`.

### UC-I5 — 📄 Checkout happy path (documented for later)
- **Input (once `STRIPE_SECRET_KEY=sk_test_...` is set):** `POST /api/billing/checkout` `{ price_id: <subscription or topup price> }`, authenticated business owner.
- **Expected output:** `200 { url }` — a real Stripe Checkout session URL. Completing checkout with Stripe's test card `4242 4242 4242 4242` should redirect to `/dashboard/billing?checkout=success` and (via webhook) grant credits/activate subscription.

### UC-I6 — Webhook missing signature ✅
- **Expected output:** `400 { error: 'Missing stripe-signature header' }`.

### UC-I7 — Webhook, Stripe not configured 🚫
- **Expected output today:** `501`.

### UC-I8 — 📄 Webhook happy path (documented for later)
- **Input:** A real `checkout.session.completed` event from Stripe CLI/test mode (`stripe trigger checkout.session.completed` or a real test-mode purchase).
- **Expected output:** `record_billing_event` runs once (deduped on `stripe_event_id`); `businesses.ad_credits` increases by the catalog entry's `creditsGranted`; `is_subscription_active` flips true for subscription mode.
- **UC-I8b:** Same event replayed (webhook retry) → `record_billing_event`'s `ON CONFLICT DO NOTHING` means credits are **not** double-granted.

### UC-I9 — Billing page ledger rendering ✅
- **Expected output:** `billing_transactions` (credits, green) merged with `scans_and_claims` usage (debits, grey) for this account, sorted newest-first.

---

## J. Trial Lifecycle

### UC-J1 — New business gets a 3-month trial ✅
- Confirmed by UC-A9: `trial_ends_at = now() + 3 months`, `is_subscription_active = true` by default, `stripe_subscription_id = null`.

### UC-J2 — Cron endpoint auth check ✅
- **Input:** `POST /api/cron/trials` with no/wrong `Authorization: Bearer` header.
- **Expected output:** `401 { error: 'Unauthorized' }`.

### UC-J3 — Cron endpoint, correct token, nothing due ✅
- **Input:** Correct `Bearer $CRON_SECRET`, no shops within the 7-day warning window.
- **Expected output:** `200 { warned: 0, expired: <N> }` (`expired` reflects any trials that lapsed since last run).

### UC-J4 — Cron endpoint, a shop is due, email not configured 🚫
- **Expected output today:** `501 { error: 'Email is not configured' }` on the first due shop (loop stops there — remaining due shops in the same batch aren't processed until this is fixed).

### UC-J5 — 📄 Cron happy path (documented for later)
- **Input (once SMTP is configured):** A business with `trial_ends_at` within 7 days, `trial_notified_at IS NULL`, `stripe_subscription_id IS NULL`.
- **Expected output:** Owner receives the trial-ending email; `trial_notified_at` set so a second cron run doesn't re-send.

### UC-J6 — Expired trial auto-deactivates ✅
- **Preconditions:** `trial_ends_at` in the past, `stripe_subscription_id IS NULL`, `is_subscription_active = true`.
- **Input:** Any cron run (or direct `select expire_lapsed_trials()`).
- **Expected output:** `is_subscription_active` flips to `false`. Confirmed separately via UC-D8 (excluded from matchmaking) and UC-B4 (banner shows).

---

## K. QR Assets
Covered by UC-B2/UC-B3 above (grouped under Owner Dashboard since that's the only place they're linked from).

---

## Summary counts

| Area | Executable now | Blocked (not configured) | Documented-only (needs real integration) |
|---|---|---|---|
| Auth/Onboarding | 12 | 0 | 0 |
| Owner Dashboard | 4 | 0 | 0 |
| Campaigns | 8 | 0 | 0 |
| Matchmaking/Scan | 9 | 0 | 0 |
| Wallet (legacy) | 2 | 1 (Apple) | 0 |
| Wallet (membership) | 7 | 0 | 2 (real Google-signed callback) |
| Redemption | 10 | 0 | 0 |
| Dashboard/Admin | 4 | 0 | 0 |
| Billing | 6 | 2 | 2 |
| Trial lifecycle | 4 | 1 | 1 |

**Total: ~66 scenarios.** Next: execute the ✅ ones against this environment and record results in `docs/test-log.md`.
