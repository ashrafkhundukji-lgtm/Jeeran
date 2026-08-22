-- Adds business_category to nearby_active_offers()'s return columns, so the
-- "Other offers nearby" page (src/app/offers/nearby, via NearbyOffersView)
-- can render a per-offer category icon/emoji without a second query per
-- offer or a secondary businesses lookup for the whole list. Same reasoning
-- as every previous extension of this function's output columns (business_
-- lat/lng, offer_updated_at, offer_image_url) — this stays the single
-- source of truth for "everything about a nearby offer," rather than each
-- caller re-deriving business-level fields itself. Another DROP+CREATE —
-- CREATE OR REPLACE can't add output columns.

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
  offer_updated_at timestamptz,
  offer_image_url text,
  business_category text
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
    c.updated_at as offer_updated_at,
    c.image_url as offer_image_url,
    b.category as business_category
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
