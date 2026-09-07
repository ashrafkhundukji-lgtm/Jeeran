-- Powers the redesigned /browse page: one flat, chip-filterable list across
-- every category (matching the wallet mini-site's /wallet/shops UX) instead
-- of the old one-category-at-a-time drill-down browse_businesses_by_category
-- used. Combines that function's score/tier ranking with the same
-- "top active offer per business" join nearby_businesses() already uses, so
-- browse rows can show/link to a live offer exactly like the wallet list
-- does. Visibility only (not_frozen), no location filtering — this page has
-- no known visitor location, unlike the wallet list.
create or replace function browse_all_businesses(p_limit int default 200)
returns table (
  business_id uuid,
  business_name text,
  category text,
  score bigint,
  level text,
  business_lat double precision,
  business_lng double precision,
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
    coalesce(r.score, 0)::bigint as score,
    promotion_level_for_score(coalesce(r.score, 0)::bigint) as level,
    b.latitude as business_lat,
    b.longitude as business_lng,
    (top.offer_id is not null) as has_active_offer,
    top.offer_id as top_offer_id,
    top.title as top_offer_title
  from businesses b
  left join (
    select business_id, count(*) as score from redemptions group by business_id
  ) r on r.business_id = b.id
  left join (
    select distinct on (c.creator_id) c.creator_id, c.id as offer_id, c.title
    from campaigns c
    where c.is_active = true and c.creator_type = 'business'
    order by c.creator_id, c.bid_per_view desc nulls last, c.updated_at desc
  ) top on top.creator_id = b.id
  where not b.is_frozen
  order by has_active_offer desc, score desc, b.created_at asc
  limit p_limit;
$$;
