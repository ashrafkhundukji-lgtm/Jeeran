-- ============================================================================
-- Content-change detection for the geo-push pipeline.
--
-- Previously, refreshMember() (src/lib/wallet/geo-notify.ts) only diffed the
-- SET of offer_ids against wallet_members.last_notified_offer_ids to decide
-- whether to re-push a member's card. That misses same-offer content edits
-- entirely (title/description wording, or a bid change too small to reorder
-- anyone's top-5) — confirmed live: editing an active campaign's title left
-- a customer's card showing the old text indefinitely, since the offer_id
-- never changed. campaigns had no updated_at at all to detect this with.
-- ============================================================================

-- campaigns.updated_at, auto-maintained by trigger so it's correct
-- regardless of which code path writes the row (API route, migration
-- script, future admin tooling) rather than relying on every caller to set
-- it by hand.
alter table campaigns add column updated_at timestamptz not null default now();
update campaigns set updated_at = created_at;

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger campaigns_set_updated_at
  before update on campaigns
  for each row
  execute function set_updated_at();

-- nearby_active_offers() now also returns each offer's updated_at, so
-- callers can detect content changes on an unchanged offer_id. Another
-- DROP+CREATE — same reason as the 20260817 migration, CREATE OR REPLACE
-- can't add output columns.
drop function if exists nearby_active_offers(double precision, double precision, numeric, int);

create function nearby_active_offers(
  p_lat double precision,
  p_lng double precision,
  p_radius_km numeric default 5,
  p_limit int default 5
)
returns table (
  offer_id uuid,
  business_id uuid,
  business_name text,
  offer_title text,
  offer_description text,
  distance_km double precision,
  business_lat double precision,
  business_lng double precision,
  offer_updated_at timestamptz
)
language sql
stable
set search_path = public, pg_temp
as $$
  select
    c.id as offer_id,
    b.id as business_id,
    b.name as business_name,
    c.title as offer_title,
    c.description as offer_description,
    ST_Distance(
      b.geog,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
    ) / 1000.0 as distance_km,
    b.latitude as business_lat,
    b.longitude as business_lng,
    c.updated_at as offer_updated_at
  from campaigns c
  join businesses b on b.id = c.creator_id and c.creator_type = 'business'
  where c.is_active = true
    and b.geog is not null
    and ST_DWithin(
      b.geog,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
      p_radius_km * 1000
    )
  order by c.bid_per_view desc nulls last, distance_km asc
  limit p_limit;
$$;

-- wallet_members.last_notified_offer_ids (uuid[]) can't carry a per-offer
-- timestamp, so it's replaced with a {offer_id: offer_updated_at} map.
-- Backfilled from the existing array using each campaign's current
-- updated_at (== created_at, from the backfill above) so already-synced
-- members don't get a spurious "changed" push the moment this ships for
-- offers that haven't actually changed since they were last notified.
alter table wallet_members add column last_notified_offers jsonb not null default '{}'::jsonb;

update wallet_members m
set last_notified_offers = coalesce(
  (select jsonb_object_agg(c.id::text, c.updated_at) from campaigns c where c.id = any(m.last_notified_offer_ids)),
  '{}'::jsonb
)
where m.last_notified_offer_ids is not null and array_length(m.last_notified_offer_ids, 1) > 0;

-- Nothing else reads last_notified_offer_ids (confirmed: only
-- geo-notify.ts's diff logic did, which now reads last_notified_offers
-- instead) — dropping it rather than leaving a stale, no-longer-written
-- column for a future reader to wonder about.
alter table wallet_members drop column last_notified_offer_ids;
