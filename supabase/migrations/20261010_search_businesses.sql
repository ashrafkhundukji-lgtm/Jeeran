-- "Search everywhere" for the wallet mini-site: nearby_businesses() and
-- nearby_active_offers() both stop at the member's push_radius_km (5 km by
-- default), and the Shops page's search box only filtered that already-
-- loaded list — so a customer looking for something specific had no way to
-- find it once it was a few km out. This searches EVERY non-frozen business
-- regardless of distance, still sorted nearest first (the page splits the
-- results into "Nearby" / "Farther away" using the member's own radius).
--
-- A business matches on any of:
--   - its name
--   - its category (p_categories — resolved in TS from the localized
--     category labels, since those only exist in src/lib/categories.ts)
--   - the title of one of its ACTIVE offers, in the original text, any of
--     the shop-provided translations, or the auto-translation cache
-- p_pattern is an ilike pattern built by the caller (wildcards already
-- escaped, then wrapped in %…%).
--
-- When the match came from an offer title, top_offer_* is THAT offer (so the
-- row links to what the customer actually searched for); otherwise it's the
-- same "top active offer" nearby_businesses() picks (bid, then most recent).
create function search_businesses(
  p_lat double precision,
  p_lng double precision,
  p_pattern text,
  p_categories text[] default '{}',
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
    (coalesce(matched.offer_id, top.offer_id) is not null) as has_active_offer,
    coalesce(matched.offer_id, top.offer_id) as top_offer_id,
    coalesce(matched.title, top.title) as top_offer_title
  from businesses b
  left join lateral (
    select c.id as offer_id, c.title
    from campaigns c
    where c.is_active = true
      and c.creator_type = 'business'
      and c.creator_id = b.id
      and (
        c.title ilike p_pattern
        or c.title_ar ilike p_pattern
        or c.title_en ilike p_pattern
        or c.title_ur ilike p_pattern
        or exists (
          select 1 from campaign_auto_translations t
          where t.campaign_id = c.id and t.title ilike p_pattern
        )
      )
    order by c.bid_per_view desc nulls last, c.updated_at desc
    limit 1
  ) matched on true
  left join lateral (
    select c.id as offer_id, c.title
    from campaigns c
    where c.is_active = true
      and c.creator_type = 'business'
      and c.creator_id = b.id
    order by c.bid_per_view desc nulls last, c.updated_at desc
    limit 1
  ) top on true
  where not b.is_frozen
    and b.geog is not null
    and (
      b.name ilike p_pattern
      or b.category = any(p_categories)
      or matched.offer_id is not null
    )
  order by distance_km asc
  limit p_limit;
$$;
