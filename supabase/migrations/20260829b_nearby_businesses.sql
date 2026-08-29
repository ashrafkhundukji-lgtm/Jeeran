-- "Nearby shops" — unlike nearby_active_offers() (which only ever returns a
-- business that currently has an active campaign), this lists every
-- non-frozen business within radius regardless of whether it has one, so a
-- customer can browse what's around them even when nothing's currently
-- being promoted. Reached from src/app/wallet/shops (linked from the Wallet
-- card's "Change language" confirmation page, which otherwise dead-ends —
-- see WalletLanguagePicker.tsx).
--
-- has_active_offer/top_offer_id/top_offer_title let the page still route
-- straight to /offers/[campaignId] for a shop that DOES have one live, same
-- destination the card's own "View offer" links use, rather than splitting
-- into two separate browsing experiences. "Top" offer per business picked
-- the same way nearby_active_offers ranks between offers generally (bid
-- first, then most recently updated) — DISTINCT ON needs a deterministic
-- order to pick from.
create function nearby_businesses(
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
      p_radius_km * 1000
    )
  order by
    has_active_offer desc,
    distance_km asc
  limit p_limit;
$$;
