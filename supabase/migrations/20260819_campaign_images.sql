-- ============================================================================
-- Offer images: campaigns.image_url + a public Storage bucket to hold them.
--
-- Investigated first (per the handoff): campaigns had no image field, and no
-- Supabase Storage bucket existed anywhere in this project (confirmed via
-- `select * from storage.buckets` returning zero rows) — this is new
-- infrastructure, not wiring up something half-built.
-- ============================================================================

alter table campaigns add column if not exists image_url text;

-- Public bucket: Google Wallet's servers need to fetch this URL directly
-- (imageModulesData.mainImage.sourceUri.uri) with no auth, and the new
-- /offers/[campaignId] landing page renders it in a plain <img>. Uploads go
-- through the server (service role, bypasses RLS) via
-- /api/campaigns/upload-image, so no storage.objects RLS policy is needed
-- for writes; `public = true` alone is what makes reads work with no policy.
insert into storage.buckets (id, name, public)
values ('campaign-images', 'campaign-images', true)
on conflict (id) do nothing;
