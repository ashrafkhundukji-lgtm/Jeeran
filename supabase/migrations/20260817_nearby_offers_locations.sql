-- ============================================================================
-- Adds business_lat/business_lng to nearby_active_offers()'s return columns,
-- so callers can populate a Google Wallet genericObject's `locations` field
-- (OS-level geofencing — the phone's own GPS compares against these points
-- and surfaces the pass on the lock screen, no server-side live tracking)
-- without a second round-trip to `businesses`. See google-membership-pass.ts.
--
-- CREATE OR REPLACE can't add output columns to an existing function's
-- return table — Postgres requires DROP + CREATE for that.
-- ============================================================================

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
  business_lng double precision
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
    b.longitude as business_lng
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

-- ----------------------------------------------------------------------------
-- Clarify what home_lat/home_lng actually govern now that the Wallet
-- `locations` field (see google-membership-pass.ts) does OS-level, on-device
-- geofencing across each member's current top offers. home_lat/home_lng
-- remain the seed for the initial nearby-offers list at signup and for the
-- server-side push radius (event-driven pushes, the periodic sweep), but
-- they are no longer what makes offers "follow" the customer physically —
-- that's now the pass's own `locations` array, updated on every push.
-- ----------------------------------------------------------------------------
comment on column wallet_members.home_lat is
  'Signup-time location seed for the initial nearby-offers list and for server-side push radius (event-driven pushes, periodic sweep) — NOT live-updated. Ongoing "follows the customer" relevance is delivered by the Wallet object''s own `locations` field (OS-level geofencing on-device), not by re-evaluating this column against the customer''s current position.';

comment on column wallet_members.home_lng is
  'See home_lat — same caveat applies.';
