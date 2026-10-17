-- ============================================================================
-- Enforce campaigns.start_date / end_date.
--
-- Until now the dates were display-only: every "live offer" query filtered
-- on is_active alone, so an offer past its end date stayed on customers'
-- cards, lists and scan pages, and stayed redeemable. offer_in_date_window()
-- is the one definition of "today is inside the offer's dates" and is added
-- next to every is_active check below. Dates are calendar days in Saudi
-- time (Asia/Riyadh), inclusive on both ends; a NULL bound is open.
--
-- Function bodies are otherwise identical to production as of 2026-10-17
-- (same signatures, same ORDER BYs — ranking itself is unchanged).
-- ============================================================================

create or replace function jeeran_today()
returns date
language sql
stable
set search_path = public, pg_temp
as $$
  select (now() at time zone 'Asia/Riyadh')::date
$$;

create or replace function offer_in_date_window(p_start date, p_end date)
returns boolean
language sql
stable
set search_path = public, pg_temp
as $$
  select (p_start is null or p_start <= jeeran_today())
     and (p_end is null or p_end >= jeeran_today())
$$;

-- ── nearby_active_offers (customer card, offers list, notifications) ──
create or replace function public.nearby_active_offers(p_lat double precision, p_lng double precision, p_radius_km numeric default 5, p_limit integer default 5)
 returns table(offer_id uuid, business_id uuid, business_name text, offer_title text, offer_description text, distance_km double precision, business_lat double precision, business_lng double precision, offer_updated_at timestamp with time zone, offer_image_url text, business_category text, title_ar text, title_en text, title_ur text, description_ar text, description_en text, description_ur text)
 language sql
 stable
 set search_path to 'public', 'pg_temp'
as $function$
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
    and offer_in_date_window(c.start_date, c.end_date)
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
$function$;

-- ── get_top_ads (scan page) ──
create or replace function public.get_top_ads(p_host_business_id uuid, p_limit integer default 3)
 returns table(campaign_id uuid, title text, description text, bid_per_view integer, creator_type text, creator_id uuid)
 language sql
 stable
 set search_path to 'public', 'pg_temp'
as $function$
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
      and offer_in_date_window(c.start_date, c.end_date)
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
$function$;

-- ── nearby_businesses (Shops tab) ──
create or replace function public.nearby_businesses(p_lat double precision, p_lng double precision, p_radius_km numeric default 5, p_limit integer default 50)
 returns table(business_id uuid, business_name text, category text, distance_km double precision, business_lat double precision, business_lng double precision, phone text, whatsapp text, has_active_offer boolean, top_offer_id uuid, top_offer_title text)
 language sql
 stable
 set search_path to 'public', 'pg_temp'
as $function$
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
      and offer_in_date_window(c.start_date, c.end_date)
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
$function$;

-- ── search_businesses (Shops search) ──
create or replace function public.search_businesses(p_lat double precision, p_lng double precision, p_pattern text, p_categories text[] default '{}'::text[], p_limit integer default 50)
 returns table(business_id uuid, business_name text, category text, distance_km double precision, business_lat double precision, business_lng double precision, phone text, whatsapp text, has_active_offer boolean, top_offer_id uuid, top_offer_title text)
 language sql
 stable
 set search_path to 'public', 'pg_temp'
as $function$
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
      and offer_in_date_window(c.start_date, c.end_date)
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
      and offer_in_date_window(c.start_date, c.end_date)
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
$function$;

-- ── browse_all_businesses (/browse) ──
create or replace function public.browse_all_businesses(p_limit integer default 200)
 returns table(business_id uuid, business_name text, category text, score bigint, level text, business_lat double precision, business_lng double precision, has_active_offer boolean, top_offer_id uuid, top_offer_title text)
 language sql
 stable
 set search_path to 'public', 'pg_temp'
as $function$
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
      and offer_in_date_window(c.start_date, c.end_date)
    order by c.creator_id, c.bid_per_view desc nulls last, c.updated_at desc
  ) top on top.creator_id = b.id
  where not b.is_frozen
  order by has_active_offer desc, score desc, b.created_at asc
  limit p_limit;
$function$;

-- ── claim_ad_credit_transaction (legacy per-offer pass claim) ──
-- Same body; an offer outside its dates can no longer be charged for.
create or replace function public.claim_ad_credit_transaction(p_host_business_id uuid, p_campaign_id uuid, p_claim_token uuid)
 returns table(credits_transferred integer, claim_id uuid)
 language plpgsql
 security definer
 set search_path to 'public', 'pg_temp'
as $function$
declare
  v_creator_type text;
  v_creator_id uuid;
  v_bid integer;
  v_claim_id uuid;
begin
  select c.creator_type, c.creator_id, c.bid_per_view
    into v_creator_type, v_creator_id, v_bid
  from campaigns c
  where c.id = p_campaign_id and c.is_active
    and offer_in_date_window(c.start_date, c.end_date)
  for update;

  if not found then
    raise exception 'Campaign not found or inactive';
  end if;

  if v_creator_type = 'business' then
    update businesses set ad_credits = ad_credits - v_bid
    where id = v_creator_id and ad_credits >= v_bid;
  else
    update technicians set ad_credits = ad_credits - v_bid
    where id = v_creator_id and ad_credits >= v_bid;
  end if;

  if not found then
    raise exception 'Insufficient advertiser credits';
  end if;

  update businesses set ad_credits = ad_credits + v_bid
  where id = p_host_business_id;

  if not found then
    raise exception 'Host business not found';
  end if;

  insert into scans_and_claims (host_business_id, campaign_id, credits_transferred, claim_token)
  values (p_host_business_id, p_campaign_id, v_bid, p_claim_token)
  returning id into v_claim_id;

  return query select v_bid, v_claim_id;
end;
$function$;
