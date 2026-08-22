-- ============================================================================
-- businesses.phone / businesses.whatsapp: optional shop-provided contact
-- info, surfaced on the public offer landing page
-- (src/app/offers/[campaignId]/page.tsx) alongside the existing "Get
-- directions" button. Investigated first: businesses had neither column
-- (confirmed against every prior migration touching this table) — this is
-- new data the shop has to actually provide, not something derivable.
--
-- Both nullable, both free text as the shop types it (not normalized/
-- validated here) — same posture as campaigns.image_url: optional, most
-- rows won't have one, callers skip rendering rather than show a
-- placeholder. `phone` is rendered as a tel: link as-is (browsers tolerate
-- spaces/dashes/parens in tel: hrefs); `whatsapp` is sanitized to digits
-- only at render time (wa.me requires a bare digit string, no spaces/+/
-- leading zeros) rather than at write time, so the dashboard form can still
-- show back exactly what the shop typed for editing.
--
-- No RLS change needed: "businesses: owner full access" already covers ALL
-- commands for auth.uid() = owner_id, which is the same policy /api/profile
-- already relies on to update name/category/latitude/longitude.
-- ============================================================================

alter table businesses add column if not exists phone text;
alter table businesses add column if not exists whatsapp text;
