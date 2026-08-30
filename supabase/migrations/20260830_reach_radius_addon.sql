-- ============================================================================
-- Reach radius: a paid add-on (business_addons, same mechanism as
-- instant_notify — see 20260823_instant_notify_addon.sql) that lets a shop
-- be discovered/ranked for customers OUTSIDE their own wallet_members.
-- push_radius_km, not just inside it. Two tiers for now:
--   reach_extended -> 10 km
--   reach_premium  -> 25 km
-- (radius values live in business_reach_radius_km() below, not a column on
-- businesses — same "read business_addons.is_active at query time, never
-- mirror it onto a businesses column" principle instant_notify already
-- follows, per the business_addons table comment: an add-on's lifecycle must
-- never be able to accidentally affect base-subscription-driven behavior.
-- The billing webhook/record_addon_billing_event/set_subscription_status
-- machinery that flips business_addons.is_active already works unchanged
-- for these two addon_keys — nothing there is reach-specific.)
--
-- This only changes VISIBILITY (the ST_DWithin bound both ranking functions
-- filter on), never the ranking itself: a reach-subscribed shop still has to
-- win the same bid-tier / promotion-level / bid / distance ordering
-- nearby_active_offers() already applies. It just becomes eligible to enter
-- that competition for customers who were previously out of range.
-- ----------------------------------------------------------------------------

-- One business's current reach boost, in km (0 if no active reach addon).
-- max(), not sum(): a business should never legitimately have more than one
-- reach_* addon active at once, but if it somehow did, the bigger one wins
-- rather than stacking.
create or replace function business_reach_radius_km(p_business_id uuid)
returns numeric
language sql
stable
set search_path = public, pg_temp
as $$
  select coalesce(max(
    case ba.addon_key
      when 'reach_premium' then 25
      when 'reach_extended' then 10
      else 0
    end
  ), 0)
  from business_addons ba
  where ba.business_id = p_business_id
    and ba.is_active = true
    and ba.addon_key in ('reach_extended', 'reach_premium');
$$;

create or replace function nearby_active_offers(
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
  business_category text,
  title_ar text,
  title_en text,
  title_ur text,
  description_ar text,
  description_en text,
  description_ur text
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
    b.category as business_category,
    c.title_ar,
    c.title_en,
    c.title_ur,
    c.description_ar,
    c.description_en,
    c.description_ur
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
      greatest(p_radius_km, business_reach_radius_km(b.id)) * 1000
    )
  order by
    ((c.bid_per_view - 2) / greatest(s.bid_tiebreak_range, 1)) desc,
    promotion_level_rank(promotion_level_for_score(coalesce(r.redemption_count, 0)::bigint)) desc,
    c.bid_per_view desc nulls last,
    distance_km asc
  limit p_limit;
$$;

create or replace function nearby_businesses(
  p_lat double precision,
  p_lng double precision,
  p_radius_km numeric default 5,
  p_limit int default 50
)
returns table (
  business_id uuid,
  business_name text,
  category text,
  distance_km double precision,
  business_lat double precision,
  business_lng double precision,
  phone text,
  whatsapp text,
  has_active_offer boolean,
  top_offer_id uuid,
  top_offer_title text
)
language sql
stable
set search_path = public, pg_temp
as $$
  select
    b.id as business_id,
    b.name as business_name,
    b.category,
    ST_Distance(
      b.geog,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
    ) / 1000.0 as distance_km,
    b.latitude as business_lat,
    b.longitude as business_lng,
    b.phone,
    b.whatsapp,
    (top.offer_id is not null) as has_active_offer,
    top.offer_id as top_offer_id,
    top.title as top_offer_title
  from businesses b
  left join (
    select distinct on (c.creator_id) c.creator_id, c.id as offer_id, c.title
    from campaigns c
    where c.is_active = true and c.creator_type = 'business'
    order by c.creator_id, c.bid_per_view desc nulls last, c.updated_at desc
  ) top on top.creator_id = b.id
  where not b.is_frozen
    and b.geog is not null
    and ST_DWithin(
      b.geog,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
      greatest(p_radius_km, business_reach_radius_km(b.id)) * 1000
    )
  order by
    has_active_offer desc,
    distance_km asc
  limit p_limit;
$$;
