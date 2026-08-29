# Jeeran Network — Solution Document

**Status:** Living document, maintained in Markdown going forward.

**Why this file exists:** `docs/Jeeran Network - Solution Document.pdf` is PDF-only — there's no
editable source for it anywhere in the repo, and this environment has no PDF tooling (`poppler-utils`
isn't installed), so it can't be read or written back into. This file is a fresh, maintained
replacement rather than an edit of that PDF. If the PDF's original source exists somewhere outside
this repo (Google Docs, Word, Notion), treat that as the canonical copy and use this file as the
change-tracking companion until they're reconciled.

---

## 1. What Jeeran Is

Jeeran Network is a **local, peer-hosted advertising network** for small shops. The core pitch:
*"Your neighbors are your best advertisers."*

- A shop hosts a printed QR stand for **nearby businesses'** offers (not its own) and earns **ad
  credits** for every scan/claim that QR stand drives.
- The shop spends those credits running **its own** campaign, which then gets surfaced at other
  shops' stands and QR scans nearby — no ad agency, no cash spend, just reciprocal local reach.
- Customers redeem offers via a **persistent Google Wallet membership pass** (Apple Wallet is
  scaffolded but not fully wired — see §6), not a coupon or a code.

## 2. Tech Stack

- **Next.js 16 (App Router, Turbopack)**, deployed on **Vercel** (project: `jeeran`, team
  `ashraf-khundukji-s-projects`). Production: `https://jeeran.vercel.app`.
- **Supabase** (Postgres 17 + PostGIS) for the database, admin/service-role access via
  `src/lib/supabase-admin.ts`, RLS-scoped access via `src/lib/supabase-server.ts` for
  session-authenticated routes.
- **Google Wallet API** for the membership pass (`src/lib/wallet/google-membership-pass.ts`).
  Apple Wallet has a legacy one-off `.pkpass` flow (`src/lib/wallet/buildPass.ts`) but no
  persistent-membership builder yet.
- **Stripe** for shop subscriptions and ad-credit top-ups (`src/app/api/billing/`).
- **MyMemory** (free, keyless translation API) for offer content auto-translation — see §7.

## 3. Core Mechanics

### 3.1 Ad-credit economy
- A shop hosts a QR stand at their counter; scanning it surfaces **other** businesses' active
  campaigns (never the host's own), ranked by `nearby_active_offers()`.
- Every scan/claim at that stand earns the **host** shop ad credits, which they spend running
  their own campaign elsewhere in the network.
- `origin_business_id` (permanent, first-touch) tracks which shop recruited a given customer, for
  attribution; a separate **rescan-credit** mechanic (`src/lib/wallet/rescan-credit.ts`) pays out
  on every subsequent scan by an already-registered customer, at any shop, subject to a
  24h-per-pair cooldown and daily cap.

### 3.2 Campaigns, bidding, and promotion tiers
- One active campaign per business (`campaigns_one_active_per_creator` constraint).
- `bid_per_view` (2–10 credits) drives ranking, primary sort key.
- **Promotion tier** (bronze/silver/gold/platinum, by redemption count) is a **tiebreaker**, not
  the primary signal — bids are grouped into buckets (`bid_tiebreak_range`, admin-configurable),
  and only within the same bucket does tier decide order. Thresholds and bucket width live in
  `promotion_settings` (single-row config table), editable via `/api/admin/settings`.
- Full ranking, in order: bid-bucket → tier → exact bid → distance
  (`nearby_active_offers()`, `supabase/migrations/20260818c_promotion_tier_tiebreaker.sql`).

### 3.3 The membership pass model
- One **persistent Generic Google Wallet pass per customer** (`wallet_members` table), not one
  pass per offer/claim. First scan creates it; every subsequent scan (anywhere in the network)
  reuses the same pass.
- The pass is kept in sync two ways:
  - **Event-driven**: a campaign going active/inactive/edited triggers `notifyMembersNearBusiness()`
    for members in range (`src/lib/wallet/geo-notify.ts`), wrapped in `after()` for Vercel
    reliability.
  - **Periodic sweep**: `refreshAllMembers()`, run daily via `/api/cron/wallet-refresh`, catches
    anything with no explicit trigger (an offer's `end_date` lapsing, etc.).
- **Card content vs. lock-screen notifications are deliberately decoupled** — the card refreshes
  silently and immediately; an actual push notification only fires from a once-daily batch job,
  capped at `promotion_settings.max_daily_wallet_notifications` (default 3, Google's own hard
  per-object/24h limit). This was a deliberate anti-uninstall-risk design change (see
  `supabase/migrations/20260820_notification_batching.sql`).
- **Geofencing** ("offers follow the customer") is delivered by the Wallet object's own
  `merchantLocations` field (OS-level, on-device) — `wallet_members.home_lat/home_lng` is only
  ever the signup-time seed for the initial offer list and the server-side push radius, **not**
  a live-tracked position. See §5 for the re-engagement refresh added this session.

### 3.4 Redemption and ad-credit settlement
- Shop staff scan the customer's persistent pass barcode (a signed member token, not tied to any
  one offer) to redeem whichever of their own offers the customer currently qualifies for.
- `claim_ad_credit_transaction_membership()` transfers `bid_per_view` credits from the redeeming
  shop to the customer's **permanent origin shop** — self-redemption (origin == redeemer) is a
  no-op, preventing a shop from farming its own stand.

## 4. Admin & Dashboard Surfaces

- **Shop dashboard** (`/dashboard/owner`): campaign create/edit, ad-credit balance, promotion tier,
  QR stand download, billing.
- **Admin panel** (`/admin`): platform-wide metrics, shop freeze/unfreeze, promotion threshold
  config.
- **Profile** (`/dashboard/profile`): shop name/category/location, and (as of this session) phone/
  WhatsApp contact info shown on the shop's public offer page.
- Localization: `ar` (default), `en`, `ur` — `src/lib/i18n/`, `localStorage`-backed, shared across
  the landing page, dashboard, and (as of this session) the public offer pages.

## 5. This Session's Changes

Chronological; all deployed to production and verified live (real device/browser clicks, real
Supabase data, not just code review) before shipping.

### 5.1 Wallet card image/link staleness fix
**Symptom reported:** an offer with an uploaded image seemed to "win" the top card slot regardless
of ranking.
**Root cause:** ranking was never affected by image presence — `nearby_active_offers()`'s `ORDER BY`
has no image-related term. The actual bug: `offersToImageModules()`/`offersToLinksModule()`
(`src/lib/wallet/google-membership-pass.ts`) returned `undefined` for "no image/no offer," and
`JSON.stringify` drops `undefined` fields entirely — Google's Wallet PATCH treats an **omitted**
key as "leave the stored value unchanged," not "clear it." So once any offer's image/links landed
on a card, they stuck there permanently even after that offer was disabled.
**Fix:** return `[]` / `{ uris: [] }` explicitly instead of `undefined`. Verified against multiple
real production Wallet objects that a disabled campaign's stale image was actually being served —
confirmed the fix, deployed, then force-repatched all registered members to flush the stale cache
immediately rather than wait for the next natural trigger.

### 5.2 Re-engagement location refresh
**Symptom:** the pass's displayed "X km" distance never updates — `home_lat/home_lng` is frozen at
signup by design (§3.3), so a customer who moves sees a stale, confusing number indefinitely.
**Fix:** `/api/wallet/membership/create` now updates `home_lat/home_lng` whenever a **returning**
member grants a fresh geolocation permission (the scan page already re-requests it on every visit),
and immediately force-refreshes their card via a new `refreshMember(member, { force: true })` path
in `geo-notify.ts` — bypassing the normal "offer set unchanged → skip" early-out, since only the
distance may have changed, not the offer list itself.
**Honest limitation kept:** this is re-engagement-triggered, not continuous — a customer who never
revisits a Jeeran touchpoint still sees a stale number. Verified live: real browser clicks, real
geolocation override, confirmed the actual Wallet object's distance text updated (0.05 km → 3.7 km)
after a simulated move.

### 5.3 Wallet card → landing page redesign
The card's `linksModuleData` was heading toward clutter (a View-offer + Directions pair per shown
offer). Redesigned:
- **Card**: exactly one "View offer – {business}" link per offer shown in `textModulesData`
  (`MAX_OFFERS_SHOWN`, currently 2) — falls back to a plain "Directions" link only if
  `NEXT_PUBLIC_APP_URL` isn't configured.
- **Landing page** (`/offers/[campaignId]`) is now the real hub: **Get directions** (existing),
  plus new **Call** (`tel:`) and **WhatsApp** (`wa.me`, sanitized to digits at render time) buttons,
  shown only when the shop has filled them in.
- New `businesses.phone` / `businesses.whatsapp` columns (`20260822_business_contact.sql`),
  editable via the dashboard Profile page.

### 5.4 "Other offers nearby"
A third Wallet-card link, shown only when `nearby_active_offers()` actually returned more than fits
on the card (no dead-end button otherwise). Opens `/offers/nearby`, a new page that runs its own
fresh, higher-limit (20) query — not bounded by the card's own capped list — and skips whatever's
already shown on the card front. Identifies the member via the same signed-token scheme already
used for the redemption barcode (`signMemberToken`/`verifyMemberToken`), not a raw member ID or raw
coordinates in the URL. Initial version's list rows had no visible tap affordance (real links, but
looked like inert text on a touchscreen with only a `:hover` state) — fixed with an explicit
"View offer →" label and a press (`active:`) state.

### 5.5 Language switcher on the public offer pages
`/offers/[campaignId]` and `/offers/nearby` split into a server component (data only) + a new
client component (`OfferPageView.tsx`, `NearbyOffersView.tsx`) so they could use the same
`useLocale()`/`LanguageSwitcher` system already on the landing page — `localStorage`-backed,
shared across all these pages. Localizes fixed chrome text and category labels; **never** the
offer's own title/description/business name (shop-typed content, same rule the Wallet card already
follows).

### 5.6 Offer content translation
Two-part, shop-first design:
- **Shop-provided override** (optional, collapsed "+ Add translations" section in the campaign
  form): `campaigns.title_ar/en/ur`, `description_ar/en/ur` — always wins when present.
- **Auto-translation fallback**: a background job (`src/lib/translate.ts`, triggered on campaign
  create/edit) populates `campaign_auto_translations`, keyed by `(campaign_id, locale)` and pinned
  to the `campaigns.updated_at` it was generated from, so a stale row (shop edited the text since)
  is detected and regenerated rather than served.
- **Provider**: originally built against an LLM (Claude Haiku) through Vercel's AI Gateway —
  verified working end-to-end, but Vercel's Gateway hard-blocks every request, even free-tier
  usage, until a credit card is on the account. Swapped to **MyMemory** (free, keyless, no
  billing) instead — real machine translation, more literal than the LLM version would have been,
  but requires nothing from the shop or the Vercel account owner. (`ai`/`zod` were installed then
  removed once this became the final approach.)
- Self-healing: a missing/stale translation for a locale doesn't block the page render — it serves
  the safe original-text fallback immediately and kicks off regeneration in the background.

### 5.7 Category icons + search on "Other offers nearby"
`nearby_active_offers()` extended (again — see the migration history in §3.2/§3.3, this is the
4th such extension) to also return `business_category`, so the page can show a per-offer category
emoji (`CATEGORY_EMOJI` in `src/lib/categories.ts`: ☕ cafe, 💇 salon, 🧺 dry-clean, 🔧 hardware,
🚗 auto, 🏪 other) without a second query. A client-side search filters by offer title, business
name, or the current locale's translated category label — no server round-trip, since the list is
already capped small (20 rows).

## 6. Known Gaps / Deliberate Tradeoffs (carried forward, not fixed this session)

- **Apple Wallet**: no persistent-membership `.pkpass` builder exists yet, only the legacy
  one-off flow. `apple_pass_serial` has a column but nothing populates it for the membership model.
- **Distance display**: re-engagement refresh (§5.2) improves but doesn't fully solve staleness —
  still not continuous/live tracking.
- **MyMemory translation quality**: literal machine translation, not LLM-quality natural phrasing.
  Revisit if Vercel AI Gateway billing gets resolved, or if translation quality complaints surface.
- **"Call" business phone**: only added this session (§5.3) — historically `businesses` had no
  phone column at all; most existing shops won't have filled it in yet.

## 7. Where Things Live (quick reference)

| Concern | Path |
|---|---|
| Membership pass build/patch | `src/lib/wallet/google-membership-pass.ts` |
| Geo-push / notification batching | `src/lib/wallet/geo-notify.ts` |
| Rescan credit | `src/lib/wallet/rescan-credit.ts` |
| Promotion tiers / ranking | `src/lib/promotion.ts`, `nearby_active_offers()` (Postgres) |
| Offer content translation | `src/lib/translate.ts` |
| Public offer pages | `src/app/offers/[campaignId]/`, `src/app/offers/nearby/` |
| Scan-landing page | `src/app/scan/[business_id]/` |
| Dashboard | `src/app/dashboard/` |
| Admin | `src/app/admin/` |
| i18n | `src/lib/i18n/` |
| Migrations | `supabase/migrations/` (chronologically named, each one's comment explains its "why") |
