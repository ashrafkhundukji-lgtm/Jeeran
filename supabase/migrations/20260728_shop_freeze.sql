-- ============================================================================
-- Shop freeze: lets an admin suspend a shop (support request, contract
-- breach, etc.) without deleting anything. A frozen shop:
--   - can't be advertised anywhere (browse page, wallet geo-push, cross-
--     promotion at other shops' scan pages)
--   - can't run/activate campaigns (enforced in the API layer)
--   - can't access its own dashboard (enforced in the app layer)
--   - shows an "unavailable" notice on its own /scan page instead of
--     redeeming (enforced in the app layer)
-- Unfreezing just flips the flag back — fully reversible.
-- ----------------------------------------------------------------------------
alter table businesses
  add column if not exists is_frozen boolean not null default false,
  add column if not exists frozen_reason text,
  add column if not exists frozen_at timestamptz;

-- Frozen shops don't show up in the category browse page.
create or replace function browse_businesses_by_category(p_category text, p_limit int default 50)
returns table (business_id uuid, business_name text, category text, score bigint, level text)
language sql
stable
set search_path = public, pg_temp
as $$
  select
    b.id as business_id,
    b.name as business_name,
    b.category,
    coalesce(r.score, 0)::bigint as score,
    promotion_level_for_score(coalesce(r.score, 0)::bigint) as level
  from businesses b
  left join (
    select business_id, count(*) as score from redemptions group by business_id
  ) r on r.business_id = b.id
  where b.category = p_category
    and not b.is_frozen
  order by score desc, b.created_at asc
  limit p_limit;
$$;

-- Frozen shops' offers don't get pushed to nearby wallet members.
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
  distance_km double precision
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
    ) / 1000.0 as distance_km
  from campaigns c
  join businesses b on b.id = c.creator_id and c.creator_type = 'business'
  left join (
    select business_id, count(*) as redemption_count from redemptions group by business_id
  ) r on r.business_id = b.id
  where c.is_active = true
    and not b.is_frozen
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

-- Frozen shops can't advertise at other shops' scan pages, and a frozen
-- host doesn't get shown any ads either (belt-and-suspenders — the scan
-- page itself also checks is_frozen before calling this at all).
create or replace function get_top_ads(p_host_business_id uuid, p_limit int default 3)
returns table (
  campaign_id uuid,
  title text,
  description text,
  bid_per_view integer,
  creator_type text,
  creator_id uuid
)
language sql
stable
set search_path = public, pg_temp
as $$
  with host as (
    select id, category, is_frozen from businesses where id = p_host_business_id
  ),
  eligible as (
    select
      c.id as campaign_id,
      c.title,
      c.description,
      c.bid_per_view,
      c.creator_type,
      c.creator_id,
      case
        when c.creator_type = 'business' then (select b.ad_credits from businesses b where b.id = c.creator_id)
        when c.creator_type = 'technician' then (select t.ad_credits from technicians t where t.id = c.creator_id)
      end as creator_credits,
      case
        when c.creator_type = 'business' then (select b.is_subscription_active from businesses b where b.id = c.creator_id)
        when c.creator_type = 'technician' then (select t.is_subscription_active from technicians t where t.id = c.creator_id)
      end as creator_subscription_active,
      case
        when c.creator_type = 'business' then (select b.is_frozen from businesses b where b.id = c.creator_id)
        else false
      end as creator_frozen
    from campaigns c, host
    where c.is_active
      and not host.is_frozen
      and not (c.creator_type = 'business' and c.creator_id = host.id)
      and not (c.creator_type = 'business' and c.creator_id in (
        select b2.id from businesses b2 where b2.category = host.category and b2.id <> host.id
      ))
      and not (c.creator_type = 'technician' and c.creator_id in (
        select t2.id from technicians t2 where t2.linked_business_id = host.id
      ))
  )
  select campaign_id, title, description, bid_per_view, creator_type, creator_id
  from eligible
  where creator_credits is not null and creator_credits > bid_per_view
    and creator_subscription_active is true
    and creator_frozen is not true
  order by
    bid_per_view desc,
    md5(campaign_id::text || floor(extract(epoch from now()) / 300)::text)
  limit p_limit;
$$;
