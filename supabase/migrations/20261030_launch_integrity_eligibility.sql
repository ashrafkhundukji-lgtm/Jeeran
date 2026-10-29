-- ============================================================================
-- Launch integrity: ONE eligibility rule for every customer-facing surface,
-- a grace period after a trial/subscription ends, and an idempotent trial
-- warning.
--
-- Before this, each surface had its own copy of the conditions and they
-- disagreed: the Wallet card (nearby_active_offers) and notification
-- candidates ignored subscription status and credits, the QR stand page
-- (get_top_ads) checked both, and the nearby/search/browse lists ignored
-- both. Now:
--
--   shop_is_exposed(b)  — the shop-level half: not frozen, AND (subscription
--                         active OR still inside the grace period). Used
--                         directly by the shop lists.
--   eligible_offers()   — the full rule: shop_is_exposed(b) AND the offer is
--                         switched on, inside its date window, AND the shop's
--                         credits >= the offer's bid. Used by every surface
--                         that shows an offer.
--
-- Consumers (signatures unchanged, so the deployed app keeps working):
--   nearby_active_offers()     Wallet card, /offers/nearby, /wallet/home
--   notification_candidates()  lock-screen send windows
--   get_top_ads()              QR stand page (/scan/[id]) — business offers only;
--                              technician offers keep their own checks
--   nearby_businesses()        /wallet/shops
--   search_businesses()        /wallet/shops search ("everywhere")
--   browse_all_businesses()    /browse
-- Ranking formulas (ORDER BY clauses) are copied unchanged.
--
-- Grace: promotion_settings.subscription_grace_days (default 7). Measured
-- from trial_ends_at for a trial shop, or from the moment the subscription
-- went inactive (businesses.subscription_inactive_since, kept by a trigger,
-- so the Stripe webhook / set_subscription_status() code is untouched).
-- Exposure no longer depends on the trials cron having run: a trial shop
-- whose trial_ends_at + grace has passed is out even if
-- is_subscription_active is still true.
--
-- Additive only: new columns, new functions, CREATE OR REPLACE with the same
-- signatures. Not touched: redemption, billing functions, ranking.
-- ============================================================================

-- ── 1. Settings ──
alter table promotion_settings
  add column if not exists subscription_grace_days int not null default 7 check (subscription_grace_days between 0 and 60),
  add column if not exists trial_warning_days int not null default 7 check (trial_warning_days between 1 and 30);

comment on column promotion_settings.subscription_grace_days is
  'Days a shop keeps full exposure after its trial ends or its subscription goes inactive. Its dashboard shows a banner with the date exposure stops. See shop_exposure_ends_at().';
comment on column promotion_settings.trial_warning_days is
  'How many days before trial_ends_at the one-time trial warning email goes out (/api/cron/trials).';

-- ── 2. When the subscription went inactive ──
alter table businesses add column if not exists subscription_inactive_since timestamptz;

comment on column businesses.subscription_inactive_since is
  'When is_subscription_active last flipped true -> false (for an expired trial: trial_ends_at). Null while active. Start of the grace period. Kept by trigger businesses_track_subscription_inactive.';

create or replace function track_subscription_inactive()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.is_subscription_active then
    new.subscription_inactive_since := null;
  elsif old.is_subscription_active and not new.is_subscription_active then
    -- A lapsed trial is measured from the trial's end, not from whenever the
    -- cron noticed; anything else (Stripe cancellation, manual) from now.
    new.subscription_inactive_since := case
      when new.stripe_subscription_id is null and new.trial_ends_at is not null and new.trial_ends_at <= now()
        then new.trial_ends_at
      else now()
    end;
  end if;
  return new;
end;
$$;

drop trigger if exists businesses_track_subscription_inactive on businesses;
create trigger businesses_track_subscription_inactive
  before update of is_subscription_active on businesses
  for each row
  execute function track_subscription_inactive();

-- Shops already inactive before this migration (none today): start their
-- grace at the trial end if that's earlier, else now.
update businesses
set subscription_inactive_since = least(coalesce(trial_ends_at, now()), now())
where not is_subscription_active and subscription_inactive_since is null;

-- ── 3. The shared rule ──
-- When the paid (or trial) period ends: infinity for a live Stripe
-- subscription, trial_ends_at for a shop still on its trial, the inactive
-- timestamp otherwise.
create or replace function shop_paid_until(b businesses)
returns timestamptz
language sql
stable
set search_path = public, pg_temp
as $$
  select case
    when b.is_subscription_active and b.stripe_subscription_id is not null then 'infinity'::timestamptz
    when b.is_subscription_active then coalesce(b.trial_ends_at, 'infinity'::timestamptz)
    else coalesce(b.subscription_inactive_since, b.trial_ends_at, '-infinity'::timestamptz)
  end
$$;

create or replace function shop_exposure_ends_at(b businesses)
returns timestamptz
language sql
stable
set search_path = public, pg_temp
as $$
  select shop_paid_until(b) + make_interval(days => coalesce((select subscription_grace_days from promotion_settings limit 1), 7))
$$;

create or replace function shop_is_exposed(b businesses)
returns boolean
language sql
stable
set search_path = public, pg_temp
as $$
  select not b.is_frozen and now() < shop_exposure_ends_at(b)
$$;

create or replace function eligible_offers()
returns table (offer_id uuid, business_id uuid)
language sql
stable
set search_path = public, pg_temp
as $$
  select c.id, b.id
  from campaigns c
  join businesses b on b.id = c.creator_id and c.creator_type = 'business'
  where c.is_active
    and offer_in_date_window(c.start_date, c.end_date)
    and b.ad_credits >= c.bid_per_view
    and shop_is_exposed(b)
$$;

comment on function eligible_offers() is
  'THE customer-facing eligibility rule for a business offer: shop not frozen, subscription active or within subscription_grace_days, offer switched on, inside its date window, shop credits >= bid. Every surface that shows an offer joins this; do not copy the conditions.';

-- Owner dashboard: is my shop visible, am I in grace, when does it stop.
create or replace function shop_exposure_status(p_business_id uuid)
returns table (exposed boolean, in_grace boolean, paid_until timestamptz, exposure_ends_at timestamptz)
language sql
stable
set search_path = public, pg_temp
as $$
  select
    shop_is_exposed(b),
    shop_is_exposed(b) and now() >= shop_paid_until(b),
    shop_paid_until(b),
    shop_exposure_ends_at(b)
  from businesses b
  where b.id = p_business_id
$$;

revoke execute on function shop_exposure_status(uuid) from public, anon, authenticated;
grant execute on function shop_exposure_status(uuid) to service_role;

-- ── 4. Consumers ──
create or replace function nearby_active_offers(
  p_lat double precision,
  p_lng double precision,
  p_radius_km numeric default 5,
  p_limit integer default 5
)
returns table (
  offer_id uuid, business_id uuid, business_name text, offer_title text, offer_description text,
  distance_km double precision, business_lat double precision, business_lng double precision,
  offer_updated_at timestamptz, offer_image_url text, business_category text,
  title_ar text, title_en text, title_ur text, description_ar text, description_en text, description_ur text
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
  from eligible_offers() e
  join campaigns c on c.id = e.offer_id
  join businesses b on b.id = e.business_id
  left join (
    select business_id, count(*) as redemption_count from redemptions group by business_id
  ) r on r.business_id = b.id
  cross join (select bid_tiebreak_range from promotion_settings limit 1) s
  where b.geog is not null
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

create or replace function notification_candidates(
  p_lat double precision,
  p_lng double precision,
  p_radius_km numeric
)
returns table (
  offer_id uuid, business_id uuid, business_name text, offer_title text, offer_description text,
  distance_km double precision, business_lat double precision, business_lng double precision,
  offer_updated_at timestamptz, offer_image_url text, business_category text,
  title_ar text, title_en text, title_ur text, description_ar text, description_en text, description_ur text,
  bid_per_view integer, content_changed_at timestamptz, business_first_offer_at timestamptz
)
language sql
stable
set search_path = public, pg_temp
as $$
  select
    c.id,
    b.id,
    b.name,
    c.title,
    c.description,
    ST_Distance(b.geog, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography) / 1000.0,
    b.latitude,
    b.longitude,
    c.updated_at,
    c.image_url,
    b.category,
    c.title_ar,
    c.title_en,
    c.title_ur,
    c.description_ar,
    c.description_en,
    c.description_ur,
    c.bid_per_view,
    c.content_changed_at,
    (select min(c2.created_at) from campaigns c2 where c2.creator_type = 'business' and c2.creator_id = b.id)
  from eligible_offers() e
  join campaigns c on c.id = e.offer_id
  join businesses b on b.id = e.business_id
  where b.geog is not null
    and ST_DWithin(
      b.geog,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
      greatest(p_radius_km, business_reach_radius_km(b.id)) * 1000
    );
$$;

revoke execute on function notification_candidates(double precision, double precision, numeric) from public, anon, authenticated;
grant execute on function notification_candidates(double precision, double precision, numeric) to service_role;

create or replace function get_top_ads(p_host_business_id uuid, p_limit integer default 3)
returns table (campaign_id uuid, title text, description text, bid_per_view integer, creator_type text, creator_id uuid)
language sql
stable
set search_path = public, pg_temp
as $$
  with host as (
    select id, category, is_frozen from businesses where id = p_host_business_id
  ),
  eligible as (
    -- Business offers: the shared rule.
    select c.id as campaign_id, c.title, c.description, c.bid_per_view, c.creator_type, c.creator_id
    from eligible_offers() e
    join campaigns c on c.id = e.offer_id
    union all
    -- Technician offers: technicians carry their own credits/subscription
    -- (not a businesses row), so they keep the checks they always had.
    select c.id, c.title, c.description, c.bid_per_view, c.creator_type, c.creator_id
    from campaigns c
    join technicians t on t.id = c.creator_id
    where c.creator_type = 'technician'
      and c.is_active
      and offer_in_date_window(c.start_date, c.end_date)
      and t.ad_credits > c.bid_per_view
      and t.is_subscription_active is true
  )
  select e.campaign_id, e.title, e.description, e.bid_per_view, e.creator_type, e.creator_id
  from eligible e, host
  where not host.is_frozen
    and not (e.creator_type = 'business' and e.creator_id = host.id)
    and not (e.creator_type = 'business' and e.creator_id in (
      select b2.id from businesses b2 where b2.category = host.category and b2.id <> host.id
    ))
    and not (e.creator_type = 'technician' and e.creator_id in (
      select t2.id from technicians t2 where t2.linked_business_id = host.id
    ))
  order by
    e.bid_per_view desc,
    md5(e.campaign_id::text || floor(extract(epoch from now()) / 300)::text)
  limit p_limit;
$$;

create or replace function nearby_businesses(
  p_lat double precision,
  p_lng double precision,
  p_radius_km numeric default 5,
  p_limit integer default 50
)
returns table (
  business_id uuid, business_name text, category text, distance_km double precision,
  business_lat double precision, business_lng double precision, phone text, whatsapp text,
  has_active_offer boolean, top_offer_id uuid, top_offer_title text
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
    from eligible_offers() e
    join campaigns c on c.id = e.offer_id
    order by c.creator_id, c.bid_per_view desc nulls last, c.updated_at desc
  ) top on top.creator_id = b.id
  where shop_is_exposed(b)
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

create or replace function search_businesses(
  p_lat double precision,
  p_lng double precision,
  p_pattern text,
  p_categories text[] default '{}'::text[],
  p_limit integer default 50
)
returns table (
  business_id uuid, business_name text, category text, distance_km double precision,
  business_lat double precision, business_lng double precision, phone text, whatsapp text,
  has_active_offer boolean, top_offer_id uuid, top_offer_title text
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
    from eligible_offers() e
    join campaigns c on c.id = e.offer_id
    where e.business_id = b.id
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
    from eligible_offers() e
    join campaigns c on c.id = e.offer_id
    where e.business_id = b.id
    order by c.bid_per_view desc nulls last, c.updated_at desc
    limit 1
  ) top on true
  where shop_is_exposed(b)
    and b.geog is not null
    and (
      b.name ilike p_pattern
      or b.category = any(p_categories)
      or matched.offer_id is not null
    )
  order by distance_km asc
  limit p_limit;
$$;

create or replace function browse_all_businesses(p_limit integer default 200)
returns table (
  business_id uuid, business_name text, category text, score bigint, level text,
  business_lat double precision, business_lng double precision,
  has_active_offer boolean, top_offer_id uuid, top_offer_title text
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
    from eligible_offers() e
    join campaigns c on c.id = e.offer_id
    order by c.creator_id, c.bid_per_view desc nulls last, c.updated_at desc
  ) top on top.creator_id = b.id
  where shop_is_exposed(b)
  order by has_active_offer desc, score desc, b.created_at asc
  limit p_limit;
$$;

-- ── 5. Trial warning: configurable lead time, claimed before sending ──
create or replace function businesses_due_trial_warning()
returns table (id uuid, owner_id uuid, name text, trial_ends_at timestamptz)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select b.id, b.owner_id, b.name, b.trial_ends_at
  from businesses b
  where b.stripe_subscription_id is null
    and b.trial_notified_at is null
    and b.trial_ends_at > now()
    and b.trial_ends_at <= now() + make_interval(days => coalesce((select trial_warning_days from promotion_settings limit 1), 7));
$$;

-- Atomic "send once": only the caller that flips trial_notified_at from null
-- gets true, so two overlapping cron runs can't both email the same shop.
create or replace function claim_trial_warning(p_business_id uuid)
returns boolean
language sql
security definer
set search_path = public, pg_temp
as $$
  with claimed as (
    update businesses set trial_notified_at = now()
    where id = p_business_id and trial_notified_at is null
    returning 1
  )
  select exists (select 1 from claimed);
$$;

-- Give the claim back when the email itself failed, so the next run retries.
create or replace function release_trial_warning(p_business_id uuid)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  update businesses set trial_notified_at = null where id = p_business_id;
$$;

revoke execute on function claim_trial_warning(uuid) from public, anon, authenticated;
revoke execute on function release_trial_warning(uuid) from public, anon, authenticated;
grant execute on function claim_trial_warning(uuid) to service_role;
grant execute on function release_trial_warning(uuid) to service_role;
