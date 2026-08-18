-- ============================================================================
-- Phase 3 (revised): tier moves from PRIMARY sort key to a tiebreaker.
--
-- bid_per_view desc is primary again (preserves the auction incentive);
-- tier only decides ordering when bids are close to each other — a
-- contested-slot scenario ("priority in case there were so many shops"),
-- not an override of bid. "Close" is implemented as a bucket: bids are
-- grouped by floor((bid_per_view - 2) / bid_tiebreak_range) — with the
-- default bid_tiebreak_range=2 that's {2,3}, {4,5}, {6,7}, {8,9}, {10}.
-- Within the same bucket, tier breaks the tie; within the same tier, exact
-- bid_per_view breaks it; distance is the final tiebreak. bid_tiebreak_range
-- is admin-configurable (see promotion_settings below), same as the
-- score thresholds.
--
-- Thresholds move to a single shared config source (promotion_settings)
-- read by promotion_level_for_score() — used by get_business_promotion_level,
-- browse_businesses_by_category, and nearby_active_offers alike, so all
-- three always agree on tier boundaries. browse_businesses_by_category's
-- own sort order is UNCHANGED: it has no bid_per_view dimension at all
-- (it ranks businesses by their own score, not campaigns/offers), so
-- there's nothing to demote score to a tiebreaker for — it already IS the
-- primary (and only) ranking signal there, exactly as intended for a
-- "top shops by tier" listing. "Consistent" here means it draws from the
-- same threshold config, not that its sort shape changes.
-- ============================================================================

create table if not exists promotion_settings (
  id boolean primary key default true check (id), -- single-row table, same pattern purpose as a settings singleton
  silver_threshold int not null default 5,
  gold_threshold int not null default 20,
  platinum_threshold int not null default 50,
  bid_tiebreak_range int not null default 2,
  updated_at timestamptz not null default now()
);

insert into promotion_settings (id) values (true) on conflict (id) do nothing;

alter table promotion_settings enable row level security;
-- Deny-by-default; only supabaseAdmin (service_role) reads/writes this.
-- Matches the existing admin-panel posture (no auth gate yet — see
-- src/app/api/admin/shops/[id]/freeze/route.ts's comment) that the new
-- /api/admin/settings route also follows.

-- promotion_level_for_score: now reads thresholds from promotion_settings
-- instead of hardcoded literals, so an admin edit takes effect everywhere
-- immediately. Was `immutable` (no table access allowed) — now `stable`
-- (safe: result can change between statements as settings change, but is
-- constant within one statement/transaction).
create or replace function promotion_level_for_score(p_score bigint)
returns text
language sql
stable
set search_path = public, pg_temp
as $$
  select case
    when p_score >= (select platinum_threshold from promotion_settings limit 1) then 'platinum'
    when p_score >= (select gold_threshold from promotion_settings limit 1) then 'gold'
    when p_score >= (select silver_threshold from promotion_settings limit 1) then 'silver'
    else 'bronze'
  end
$$;

-- nearby_active_offers: bid-bucket primary, tier tiebreak within a bucket,
-- exact bid as secondary tiebreak, distance last. Another DROP+CREATE —
-- CREATE OR REPLACE can't add output columns, and this also changes the
-- ORDER BY, which CREATE OR REPLACE can do, but keeping the DROP+CREATE
-- pattern consistent with the two migrations earlier today.
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
  left join (
    select business_id, count(*) as redemption_count from redemptions group by business_id
  ) r on r.business_id = b.id
  cross join (select bid_tiebreak_range from promotion_settings limit 1) s
  where c.is_active = true
    and b.geog is not null
    and ST_DWithin(
      b.geog,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
      p_radius_km * 1000
    )
  order by
    ((c.bid_per_view - 2) / greatest(s.bid_tiebreak_range, 1)) desc,
    promotion_level_rank(promotion_level_for_score(coalesce(r.redemption_count, 0)::bigint)) desc,
    c.bid_per_view desc nulls last,
    distance_km asc
  limit p_limit;
$$;
