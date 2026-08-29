-- Lets an end customer explicitly pick which language their Jeeran Offers
-- Wallet pass shows content in, instead of relying solely on Google Wallet's
-- own automatic LocalizedString resolution (which picks based on the
-- VIEWER's phone/Google-account language and offers no in-pass control of
-- its own — see the header comment in src/lib/wallet/google-membership-pass.ts).
-- NULL (the default, and every existing member's value) preserves that exact
-- current behavior: Google auto-detects. Only once a member explicitly sets
-- a preference (src/app/api/wallet/membership/language/route.ts, reachable
-- from the pass's own "Change language" link) does the pass start sending a
-- single fixed language, overriding the auto-detection.
alter table wallet_members
  add column preferred_language text
  check (preferred_language is null or preferred_language in ('ar', 'en', 'ur'));

-- Extends nearby_active_offers() with the shop-provided per-locale overrides
-- (campaigns.title_ar/en/ur, description_ar/en/ur) already used by the offer
-- landing page (src/app/offers/[campaignId]/page.tsx). Needed so the Wallet
-- card can apply that SAME shop-override > fresh-auto-translation-cache >
-- raw-text fallback chain when resolving offer content for a member's chosen
-- preferred_language (see src/lib/wallet/offer-locale.ts), instead of always
-- showing whatever raw language the shop happened to type into
-- title/description. Another DROP+CREATE — CREATE OR REPLACE can't add
-- output columns, same as every previous extension of this function
-- (business_lat/lng, offer_updated_at, offer_image_url, business_category).
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
      p_radius_km * 1000
    )
  order by
    ((c.bid_per_view - 2) / greatest(s.bid_tiebreak_range, 1)) desc,
    promotion_level_rank(promotion_level_for_score(coalesce(r.redemption_count, 0)::bigint)) desc,
    c.bid_per_view desc nulls last,
    distance_km asc
  limit p_limit;
$$;
