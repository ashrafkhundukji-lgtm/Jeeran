-- ============================================================================
-- Fixes a regression introduced earlier today (20260817_nearby_offers_locations.sql
-- and 20260817b_offer_content_versioning.sql): both DROP+CREATE'd
-- nearby_active_offers() by extending the ORIGINAL 20260719 definition,
-- without checking that 20260728_promotion_levels_ranking.sql had already
-- superseded it — making promotion_level_rank(...) the PRIMARY sort key
-- (ahead of bid_per_view and distance), live since 2026-07-28. Confirmed via
-- list_migrations that promotion_levels_ranking was applied before either of
-- today's migrations. Net effect: every wallet geo-push since ~13:01 UTC
-- today ranked by bid_per_view instead of promotion tier, silently dropping
-- the "give higher promotion-level shops an edge" behavior for the whole
-- platform. This restores that ordering, keeping today's two legitimate
-- additions (business_lat/business_lng, offer_updated_at).
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
  where c.is_active = true
    and b.geog is not null
    and ST_DWithin(
      b.geog,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
      p_radius_km * 1000
    )
  order by
    promotion_level_rank(promotion_level_for_score(coalesce(r.redemption_count, 0)::bigint)) desc,
    c.bid_per_view desc nulls last,
    distance_km asc
  limit p_limit;
$$;
