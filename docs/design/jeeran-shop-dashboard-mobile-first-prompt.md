Read AGENTS.md and the Next.js docs under node_modules/next/dist/docs/ first (this Next.js version differs from older ones).

# Task: shop dashboard refresh (MOBILE-FIRST) + shop identity + QR sheet

Branch `design/shop-dashboard-refresh` from current master (PR #11 must be merged first; if it is not, stop and tell me). Preview deployment only. Do NOT merge or deploy to production until I approve.

## Critical context
The shop owners will manage everything from their PHONE (they have no PC at the shop). Design and test for 360x800, 390x844 and 430x932 first. Desktop only needs to look intentional and not broken: a centered column (max ~480px) with the nav inside it. Do not build a separate desktop layout.

I reviewed the live dashboard (`/dashboard/owner`, `/redeem`, `/billing`, `/profile`, `/owner/leaderboard`) at desktop width only; mobile was NOT verified, so treat every mobile defect you find as real work and list them in the report.

Use the same design system as the customer screens (navy #1E3A8A / #12296B, coral #CF3B19, cream #FFF8F1, line #EDE3D6, muted #5A6385, tints #EAF0FC / #C9D6F4; Readex Pro headings, IBM Plex Sans Arabic body; inline stroke SVG icons, no emoji; reuse the existing shared components and tokens, do not duplicate them). The dashboard currently uses plum/purple + pink and the redeem page is near-black: re-skin all of them to the system. Dashboard stays RTL-first, with ar/en/ur supported as today.

## Part 1. Fix what is broken (found on live)
1. Campaign active toggle: the same campaign shows a pink toggle in the "active offer" card and a green toggle in the campaigns list. One shared toggle component with one on/off style (on = navy, off = grey), accessible label, optimistic update with rollback on error. Also check RTL: at desktop width in Arabic the knob of the "on" pink toggle sat on the left and read as "off"; the knob position must be mirrored correctly in RTL.
2. "Active offer" card shows an empty striped placeholder when the campaign has no image. Use the category icon cover (same as customer CategoryCover) or the shop cover once Part 4 exists.
3. New-campaign form uses raw browser controls: English "No file chosen / Choose File" and `mm/dd/yyyy` date inputs inside an Arabic UI. Replace with proper styled controls (see Part 3).
4. Leaderboard page (`/dashboard/owner/leaderboard`) stays on "جارٍ التحميل…" with nothing else. Add skeleton, real empty state ("لا يوجد عملاء جدد بعد هذا الأسبوع…" with a hint), and an error state. Do not change how it ranks.
5. Floating nav/logo at desktop width and the old logo asset next to it: replace with the navy/coral logo; bottom tab bar fixed, 56px+ high, safe-area padding, 44px+ tap targets, active tab clearly marked.
6. Profile "save changes" button is faint and tiny at the top corner: replace with a sticky bottom save bar that appears only when something changed (dirty state), with saving/success/error feedback.
7. Terminology: replace "نقاط الإعلان / نقاط" with "رصيد إعلاني" everywhere in the dashboard and billing (all languages), including the top chip, the balance card, campaign price-per-view lines and the packages. Do not change DB column names or API contracts.
8. Currency: billing shows dollars. Check what Stripe is configured with and tell me; do NOT change prices or currency, only report.

9. Defects confirmed on a real phone (English UI, ~390px wide, Samsung browser):
   - The floating pill tab bar covers the content behind it (the QR card and "Most active shops" row are hidden under it). Add enough bottom padding so the last element on every page is fully reachable above the bar, and restyle the bar to the system: active item navy with a white icon (today it is a purple circle with a gold icon, a fourth colour).
   - Redeem page: a black screen with one small pink "Start scanning" button floating in a huge empty area, and the manual-entry card pinned to the bottom. Rebuild per Part 5 (camera viewport area with framing guide, not a void).
   - Home stat labels are ungrammatical in English: "scan hosted", "customer acquired". Use "Scans hosted" / "Customers acquired" (and check ar/ur equivalents for plural/number agreement).
   - Profile: "Save changes" is faint pink text at the top right, so it looks permanently disabled; the map is a thin strip about 230px tall; "Category" row has a chevron but looks like static text. Fix per Part 6.
   - Billing: history shows a huge empty area with "No activity yet."; give it a proper empty state and keep the package cards.
   - Tier badge "Bronze" has no explanation (Part 2).

## Part 2. Dashboard home (`/dashboard/owner`) on mobile
- Header: shop name + logo/avatar (Part 4), tier badge "برونزي" with a tap-to-explain bottom sheet (what the tier means and what unlocks the next one, using whatever the existing milestone logic actually says; do not invent rules).
- Balance card: balance, "enough for N views at X/view", prominent "شحن الرصيد" button, low-balance warning state (reuse existing thresholds if any, otherwise show only when it covers fewer than 10 views).
- Stats: the two numbers (hosted scans, acquired customers) with a simple "this week vs last week" delta if the data exists; if not, leave the numbers and say so in the report.
- "Complete your shop" checklist card (only while incomplete, dismissible): add logo, add shop details/hours, create first offer, print QR sheet. Derive completion from real data.
- Active offer card + "preview as customer" link: keep, restyle.
- Campaign list: each row shows title, status toggle, price per view, and real stats if available (views, redemptions, spent). Row tap opens edit. Add "duplicate campaign". Use the existing data; if per-campaign stats do not exist in the API, do not fabricate: list what is missing and propose the minimal read-only query.
- QR block: show a small preview, a "Download PDF" button and a "Share" button using the Web Share API (fallback: download), so a shop can send it to a printer on WhatsApp.
- Install hint: if feasible without scope creep, add a web app manifest + a dismissible "Add to home screen" hint for owners (they will open this daily). If it is more than a small change, skip it and list it as a proposal.

## Part 3. New / edit campaign form (mobile)
- Full-screen sheet or page with a sticky bottom "Create campaign" button; keep keyboard from covering the active field.
- Inputs 16px+ font (no iOS zoom), 48px+ high, correct `inputmode`.
- Image: styled uploader with camera/gallery (`accept="image/*"`), client-side downscale to max 1280px before upload, preview, replace/remove, friendly errors. Keep using the existing campaign image upload API.
- Dates: mobile-friendly date pickers shown in the page language/numerals consistently; end must be after start; presets "اليوم / أسبوع / شهر".
- Price per view slider: add plain-language explanation of what it does (higher price = reach farther / appear higher) ONLY in the terms the existing ranking and radius-boost logic actually implement; read that logic first and describe it accurately. Show the estimated number of views the current balance buys.
- Live preview card exactly as customers will see it (reuse the customer OfferCard), updating as they type.
- Translations section stays optional but is a collapsible, clearer block.
- Confirm before discarding a half-filled form.
- Do NOT add new offer types, budget caps or new DB fields in this round; list them as proposals.

## Part 5. Redeem page (cashier-facing, phone camera)
- Re-skin to the system (no black screen). Full-width camera viewport with a clear framing box, torch toggle if the browser supports it, permission-denied state with how to fix it, manual code entry with numeric keyboard as a clear fallback.
- Result states must be unmistakable at arm's length: success (large check, offer name, customer-facing confirmation), already used, expired/invalid, wrong shop, network error. Add haptic vibration on success where supported.
- A short "recent redemptions" list under the scanner. Do not change redemption logic or any API route.

## Part 6. Profile page
- Mobile layout: grouped cards (Shop, Contact, Location, Language), editable fields visible as inputs, not static rows with chevrons.
- Add Part 4 shop identity section at the top.
- Location: map must be a usable height on phone (not a thin strip), "use my current location" button stays, show the saved coordinates status.
- Phone/WhatsApp: validate Saudi format as a hint, do not block other countries.
- Keep fields that exist; do not add new DB fields except the two image columns in Part 4. List extra fields I should consider (description, opening hours, address text, maps link, social links) as proposals in the report.

## Part 7. Billing page
- Mobile layout: subscription card, then credit packages as vertically stacked tappable cards with the best-value badge, then history with a proper empty state.
- Do not change pricing, Stripe logic or amounts. Report whether invoice history and a manage-subscription (Stripe customer portal) link are available today and what would be needed to add them.

## Global acceptance for the dashboard
- No horizontal scroll at 360px on any page; no text under 14px for body, 12px for captions; tap targets 44px+.
- Loading skeletons, empty states and error states on every page.
- Arabic, English and Urdu strings for all new copy, using the existing i18n mechanism; shop-entered text never altered; `dir="auto"`/`<bdi>` on shop-entered text.
- Lighthouse-style sanity on the owner pages: no layout shift from images, fonts preloaded as on customer pages.
- Playwright screenshots of EVERY dashboard page at 390x844 and 360x800 (ar), plus 390 en and ur for home and redeem, plus desktop 1280 for home only, with an index.html. Include the states: empty shop, shop with logo, low balance, form error, scanner permission denied, redeem success and failure.

# Parts 4 and 8: shop identity and QR sheet (from the earlier prompt, unchanged except where marked)
## Part 8A. QR sheet (PDF)
Find where the PDF is generated and fix it. Do not change what the QR encodes (it must keep pointing to `/scan/[business_id]`; verify a scan of the generated PDF still opens the right shop).
- Header: the shop name, large and prominent, with `dir="auto"` handling so Arabic-only, English-only and mixed names all render correctly. If the shop has a logo (Part 4), show it above the name; otherwise show the Jeeran mark only.
- Jeeran brand is secondary on this sheet (small, top or bottom), not the headline.
- Under the QR, a bilingual explanation, Arabic first then English, both always present, for example:
  - AR: "امسح الرمز لتشاهد عروض هذا المحل وجيرانه القريبين منك. مجانًا، بدون تطبيق."
  - EN: "Scan to see offers from this shop and its neighbours nearby. Free, no app needed."
  Keep the wording short and plain; if you improve it, tell me the final text. Do not claim anything the scan page does not do.
- Use embedded fonts that actually support Arabic (Readex Pro for headings, IBM Plex Sans Arabic for body, as in the app). The current Arabic renders in a serif fallback, which is a bug. Verify Arabic shaping is correct (connected letters, correct order) in the output.
- Colors: only navy #1E3A8A / #12296B, coral #CF3B19, cream #FFF8F1, line #EDE3D6. Remove the pale grid/dotted decorations if they hurt print clarity. QR must stay pure black on white with a proper quiet zone, at least 6 cm square when printed on A4.
- Provide A4 portrait. If it is trivial, also offer an A5 / table-tent size; otherwise skip and tell me.
- Generate the PDF for these test cases and include them in the screenshots: Arabic-only name, English-only name, mixed name, very long name (wraps to 2 lines max with graceful truncation), shop with logo, shop without logo.

## Part 4. Shop logo and cover image
Data:
- New migration: add nullable `logo_url text` and `cover_url text` to `businesses`. Additive only. Show me the SQL before applying it to production, and apply it to the preview/branch database if one exists; if only one database exists, tell me and wait for my OK before running it.
- New public storage bucket `business-images` (or a justified alternative), 2 MB limit, mime allowlist png/jpeg/webp. NO SVG (script injection risk).

Upload API (new route, e.g. under `src/app/api/business/[id]/images`; creating a new route is in scope, changing existing API routes is not):
- Authenticated owner of that business only; reject others and reject frozen/non-existent shops cleanly.
- Validate by file signature (magic bytes), not just the declared mime type, and by size.
- Logo: center-crop to a square and resize to 512x512, output webp. Cover: resize to max 1200px wide, 16:9 crop, output webp. Strip EXIF. Use `sharp` if it is already a dependency or can be added safely on Vercel.
- Replacing deletes the old object. A "remove" action clears the column and deletes the object.
- Storage path namespaced by business id; unguessable file names.

Dashboard UI (the shop's profile/settings page):
- New "هوية المحل / Shop identity" section: logo upload (square preview), optional cover upload, remove buttons, clear helper text (recommended size, formats, max size) in the dashboard language(s) the app already supports.
- A live preview of how the shop will look to customers: the offer-card avatar and the QR sheet header. Keep it simple.
- Handle upload progress, errors (too big, wrong type, network) with friendly messages, and a success state.
- Use the new dashboard design system from Parts 1-7; the section must work at 360px first.

Customer-facing use (only where it is a pure improvement, with graceful fallback to the first-letter avatar when absent):
- `ShopAvatar` shows the logo when present (object-fit cover, circular), falling back to the letter avatar. This one component should cover the offers list, shops list, offer page header and scan page.
- Offer cards/hero for an offer that has no image of its own may use the shop cover as the background instead of the icon gradient. Offers with their own image keep it.
- Always keep alt text/aria labels correct and keep layout stable while images load (fixed dimensions, no shift).

## Hard limits
- No changes to wallet logic (`src/lib/wallet/`), ranking, redemption logic, billing/Stripe logic or prices, or existing routes under `src/app/api/`, beyond the new image upload route. UI-only changes to the pages listed above are in scope.
- Never alter shop-entered text content.
- Test with my logged-in test account on a ZZTEST shop only. After testing, delete every test image from storage and reset the columns, then show me zero-residue proof (storage object count for the bucket and a query of non-null logo_url/cover_url).
- No third-party image hosts, no tracking.

## Report back
- Preview URL, branch, PR link.
- Screenshots as specified under "Global acceptance", plus the customer screens with and without a shop logo (390x844, ar and en), and the generated QR PDFs listed above rasterized to PNG.
- What you changed vs. what I asked, any decisions you had to make, and anything you found in the shop dashboard that looks broken or unfinished (list only, do not fix it).
- The exact bilingual footer text you used.
