-- ============================================================================
-- Offer content translation: shop-provided overrides + a machine-translated
-- fallback cache.
--
-- Business name is deliberately NOT covered here — proper nouns/brand names
-- generally aren't translated (same convention as "McDonald's" staying
-- "McDonald's" in Arabic), and machine-translating one would routinely
-- produce nonsense or something the shop wouldn't recognize as their own
-- name. Only campaign title/description (real marketing copy, appropriate
-- to translate) are covered.
--
-- Two distinct concerns, two different storage shapes:
--
-- 1. Shop-provided translations: real user input a shop deliberately typed,
--    must never be silently lost/regenerated — plain nullable columns on
--    campaigns itself, same posture as image_url (optional, most rows won't
--    have one, callers skip rather than show a placeholder).
--
-- 2. Auto-translation cache: NOT real data, purely a cache of what an LLM
--    produced for the campaign's current title/description — safe to wipe
--    or regenerate anytime, so it gets its own small table rather than
--    columns on campaigns. source_updated_at pins each cached row to the
--    campaigns.updated_at it was generated from (that column already exists
--    and is already auto-maintained by a trigger — see
--    20260817b_offer_content_versioning.sql) so a reader can detect a stale
--    translation (title/description edited since) without a separate
--    invalidation mechanism, the same "compare updated_at" technique
--    already established for the wallet-push content-change detection.
-- ============================================================================

alter table campaigns add column if not exists title_ar text;
alter table campaigns add column if not exists title_en text;
alter table campaigns add column if not exists title_ur text;
alter table campaigns add column if not exists description_ar text;
alter table campaigns add column if not exists description_en text;
alter table campaigns add column if not exists description_ur text;

create table if not exists campaign_auto_translations (
  campaign_id uuid not null references campaigns(id) on delete cascade,
  locale text not null check (locale in ('ar', 'en', 'ur')),
  title text not null,
  description text,
  -- campaigns.updated_at at generation time. A reader compares this against
  -- the campaign's CURRENT updated_at: match = fresh, mismatch = stale (the
  -- shop edited title/description since) = fall back to the original text
  -- and kick off a background regeneration rather than show outdated
  -- machine-translated copy.
  source_updated_at timestamptz not null,
  created_at timestamptz not null default now(),
  primary key (campaign_id, locale)
);

alter table campaign_auto_translations enable row level security;
-- Deny-by-default; only supabaseAdmin (service_role) reads/writes this —
-- it's a server-generated cache, never written to directly by a shop owner
-- or read directly by browser JS (the offer page's own server component
-- reads it via supabaseAdmin and passes the resolved text down as props).
