-- ============================================================================
-- Jeeran: geo-targeted wallet push infrastructure
-- Adds: PostGIS, businesses.geog, wallet_members (persistent pass registry),
-- nearby offer lookup, redemption ledger + analytics for the membership-pass
-- model.
-- ============================================================================

create extension if not exists postgis;

-- ----------------------------------------------------------------------------
-- businesses.geog: generated geography column from the existing nullable
-- latitude/longitude, same pattern as wallet_members.home_geog below. Needed
-- because nearby_active_offers() ranks businesses by distance via PostGIS.
-- Businesses without coordinates yet simply generate a null geog and are
-- excluded from ST_DWithin matches (not an error).
-- ----------------------------------------------------------------------------
alter table businesses
  add column if not exists geog geography(Point, 4326) generated always as (
    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
  ) stored;

create index if not exists businesses_geog_idx on businesses using gist (geog);

-- ----------------------------------------------------------------------------
-- wallet_members: one row per customer who has saved the Jeeran membership
-- pass to their Google/Apple wallet. This pass gets patched/updated with
-- nearby offers instead of issuing a new pass per offer.
-- ----------------------------------------------------------------------------
create table if not exists wallet_members (
  id uuid primary key default gen_random_uuid(),

  -- platform pass identifiers (nullable — a member may have one or both)
  google_object_id text unique,
  apple_pass_serial text unique,

  -- Attribution ONLY — records which shop's QR stand drove this signup, for
  -- ad-credit accounting on the host side. Must NEVER be used to filter or
  -- restrict which offers this member receives — see nearby_active_offers()
  -- below, which is intentionally platform-wide and ignores this column.
  origin_business_id uuid references businesses(id),

  -- "home" location captured at save-time (browser geolocation or host-shop
  -- fallback). Originally this was what ongoing proximity relevance was
  -- computed against — no longer true. As of
  -- supabase/migrations/20260817_nearby_offers_locations.sql, it's just the
  -- seed for the initial nearby-offers list plus the radius used by
  -- server-side pushes (event-driven + periodic sweep); actual "follows the
  -- customer" relevance is delivered by the Wallet object's own `locations`
  -- field (OS-level geofencing), not by re-checking this column against
  -- where the customer currently is. See that migration's column comment
  -- (`comment on column wallet_members.home_lat`) for the authoritative
  -- version of this note.
  home_lat double precision not null,
  home_lng double precision not null,
  home_geog geography(Point, 4326) generated always as (
    ST_SetSRID(ST_MakePoint(home_lng, home_lat), 4326)::geography
  ) stored,

  push_radius_km numeric not null default 5,
  last_notified_at timestamptz,
  last_notified_offer_ids uuid[] default '{}',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists wallet_members_home_geog_idx
  on wallet_members using gist (home_geog);

-- ----------------------------------------------------------------------------
-- nearby_active_offers: given a lat/lng and radius, return currently active
-- campaigns from businesses within range, ranked by bid then distance.
--
-- Business-only for MVP: campaigns.creator_type can also be 'technician', but
-- technicians have no geog column and aren't part of this iteration's geo
-- targeting — they're excluded by the creator_type filter below on purpose,
-- not by omission. Revisit if/when technician campaigns need geo-push.
--
-- IMPORTANT: this is deliberately PLATFORM-WIDE. It queries ALL active
-- business campaigns within radius, regardless of which shop the customer
-- originally scanned to join. Do not add an origin_business_id / host filter
-- here — the one-time scan is an entry point into the whole network, not a
-- subscription to a single shop's offers. origin_business_id exists purely
-- for host ad-credit attribution (see wallet_members).
-- ----------------------------------------------------------------------------
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
  where c.is_active = true
    and b.geog is not null
    and ST_DWithin(
      b.geog,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
      p_radius_km * 1000
    )
  order by c.bid_per_view desc nulls last, distance_km asc
  limit p_limit;
$$;

-- ----------------------------------------------------------------------------
-- members_within_radius: given a business location, return every registered
-- wallet member whose home location falls within p_radius_km. Used to find
-- the candidate set to re-check/patch when a new offer goes live.
-- ----------------------------------------------------------------------------
create or replace function members_within_radius(
  p_lat double precision,
  p_lng double precision,
  p_radius_km numeric default 20
)
returns setof wallet_members
language sql
stable
set search_path = public, pg_temp
as $$
  select *
  from wallet_members
  where google_object_id is not null
    and ST_DWithin(
      home_geog,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
      p_radius_km * 1000
    );
$$;

-- ----------------------------------------------------------------------------
-- redemptions: logs each time a shop scans a member's membership-pass
-- barcode and honors an offer. Enforces one redemption per (member, offer)
-- so the same customer can't claim the same campaign twice, while still
-- letting them redeem DIFFERENT offers at different shops on one pass.
-- ----------------------------------------------------------------------------
create table if not exists redemptions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references wallet_members(id),
  business_id uuid not null references businesses(id),
  offer_id uuid not null references campaigns(id),
  redeemed_by_staff_id uuid, -- optional: staff/user account that scanned, if you track staff logins
  redeemed_at timestamptz not null default now(),
  unique (member_id, offer_id)
);

create index if not exists redemptions_business_idx on redemptions (business_id, redeemed_at desc);

-- ----------------------------------------------------------------------------
-- offer_notifications: logs the first time a member's pass was patched to
-- include a given offer. This is "reach" — paired with redemptions ("claim"),
-- it lets you compute a conversion rate (notified -> walked in and redeemed),
-- which is a much stronger pitch to shops than a raw redemption count alone.
--
-- unique(member_id, offer_id) mirrors redemptions' constraint: we count
-- UNIQUE members reached per offer, not every repeated impression while the
-- offer sits in someone's top-5 nearby list across multiple refreshes.
-- ----------------------------------------------------------------------------
create table if not exists offer_notifications (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references wallet_members(id),
  business_id uuid not null references businesses(id),
  offer_id uuid not null references campaigns(id),
  notified_at timestamptz not null default now(),
  unique (member_id, offer_id)
);

create index if not exists offer_notifications_business_idx on offer_notifications (business_id, notified_at desc);

-- ----------------------------------------------------------------------------
-- Redemption analytics — powers "customers claimed via Jeeran" numbers on
-- both the shop dashboard (scoped to one business) and the admin dashboard
-- (platform-wide). All read from the same redemptions table, no new writes.
-- ----------------------------------------------------------------------------

-- Per-shop summary: total claims, unique customers, and recent activity.
create or replace function business_redemption_summary(p_business_id uuid)
returns table (
  total_redemptions bigint,
  unique_customers bigint,
  redemptions_last_7d bigint,
  redemptions_last_30d bigint
)
language sql
stable
set search_path = public, pg_temp
as $$
  select
    count(*) as total_redemptions,
    count(distinct member_id) as unique_customers,
    count(*) filter (where redeemed_at >= now() - interval '7 days') as redemptions_last_7d,
    count(*) filter (where redeemed_at >= now() - interval '30 days') as redemptions_last_30d
  from redemptions
  where business_id = p_business_id;
$$;

-- Per-shop daily series, for a simple claims-over-time chart on the shop dashboard.
create or replace function business_redemption_timeseries(p_business_id uuid, p_days int default 30)
returns table (day date, redemptions bigint)
language sql
stable
set search_path = public, pg_temp
as $$
  select date_trunc('day', redeemed_at)::date as day, count(*) as redemptions
  from redemptions
  where business_id = p_business_id
    and redeemed_at >= now() - (p_days || ' days')::interval
  group by 1
  order by 1;
$$;

-- Platform-wide summary for the admin dashboard: overall traction plus
-- which shops are driving/benefiting most, to show the service is working
-- both broadly and for specific accounts.
create or replace function platform_redemption_summary()
returns table (
  total_redemptions bigint,
  unique_customers bigint,
  active_businesses bigint,
  redemptions_last_7d bigint,
  redemptions_last_30d bigint
)
language sql
stable
set search_path = public, pg_temp
as $$
  select
    count(*) as total_redemptions,
    count(distinct member_id) as unique_customers,
    count(distinct business_id) as active_businesses,
    count(*) filter (where redeemed_at >= now() - interval '7 days') as redemptions_last_7d,
    count(*) filter (where redeemed_at >= now() - interval '30 days') as redemptions_last_30d
  from redemptions;
$$;

-- Leaderboard of shops by redemptions received, for the admin dashboard.
create or replace function platform_top_businesses_by_redemptions(p_limit int default 10)
returns table (business_id uuid, business_name text, redemptions bigint, unique_customers bigint)
language sql
stable
set search_path = public, pg_temp
as $$
  select
    r.business_id,
    b.name as business_name,
    count(*) as redemptions,
    count(distinct r.member_id) as unique_customers
  from redemptions r
  join businesses b on b.id = r.business_id
  group by r.business_id, b.name
  order by redemptions desc
  limit p_limit;
$$;

-- Per-shop reach vs. claim: how many unique customers were notified about
-- this shop's offers, vs. how many actually walked in and redeemed.
create or replace function business_conversion_summary(p_business_id uuid)
returns table (
  reached bigint,
  redeemed bigint,
  conversion_rate numeric
)
language sql
stable
set search_path = public, pg_temp
as $$
  select
    (select count(distinct member_id) from offer_notifications where business_id = p_business_id) as reached,
    (select count(distinct member_id) from redemptions where business_id = p_business_id) as redeemed,
    case
      when (select count(distinct member_id) from offer_notifications where business_id = p_business_id) = 0 then 0
      else round(
        (select count(distinct member_id) from redemptions where business_id = p_business_id)::numeric
        / (select count(distinct member_id) from offer_notifications where business_id = p_business_id) * 100,
        1
      )
    end as conversion_rate;
$$;

-- Platform-wide reach vs. claim, for the admin dashboard's headline metric.
create or replace function platform_conversion_summary()
returns table (
  reached bigint,
  redeemed bigint,
  conversion_rate numeric
)
language sql
stable
set search_path = public, pg_temp
as $$
  select
    (select count(distinct member_id) from offer_notifications) as reached,
    (select count(distinct member_id) from redemptions) as redeemed,
    case
      when (select count(distinct member_id) from offer_notifications) = 0 then 0
      else round(
        (select count(distinct member_id) from redemptions)::numeric
        / (select count(distinct member_id) from offer_notifications) * 100,
        1
      )
    end as conversion_rate;
$$;

-- ----------------------------------------------------------------------------
-- claim_ad_credit_transaction_membership: ad-credit transfer for the
-- membership-pass redemption model.
--
-- "Host" is redefined vs. the original claim_ad_credit_transaction(): since
-- redemption now happens directly at the advertiser's own shop with no
-- third-party stand in the loop, the earning party is
-- wallet_members.origin_business_id — the shop whose QR stand originally
-- recruited this customer. That shop earns credit on every redemption this
-- customer makes anywhere on the platform, not just at their own stand.
--
-- Amount and mechanics are aligned with the real claim_ad_credit_transaction()
-- (supabase/migrations/20260712_claim_ad_credit_transaction.sql):
--   - transfer amount = the redeemed campaign's bid_per_view (not a flat fee)
--   - conditional UPDATE ... WHERE ad_credits >= amount, not a separate
--     select-then-check, so concurrent redemptions can't race past the
--     balance check
--   - insufficient-funds raises (caller in /api/redeem already treats this
--     RPC's errors as non-fatal to the customer-facing redemption, so raising
--     here does not block the redemption itself — only the credit transfer)
--   - locked FOR UPDATE on the campaign row for the duration of the transfer
--   - security definer + pinned search_path + revoked from anon/authenticated,
--     matching the advisor-driven hardening already applied to the original
--     function
--
-- Self-recruited redemption (the recruiting shop is also the shop being
-- redeemed at) is a no-op rather than a payout, to prevent a shop farming its
-- own QR stand for credits. Confirm this is the desired policy before relying
-- on it — see the handoff notes.
-- ----------------------------------------------------------------------------
create or replace function claim_ad_credit_transaction_membership(
  p_member_id uuid,
  p_offer_id uuid,
  p_redeeming_business_id uuid
)
returns table (credits_transferred integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_origin_business_id uuid;
  v_bid integer;
begin
  select c.bid_per_view into v_bid
  from campaigns c
  where c.id = p_offer_id
    and c.creator_type = 'business'
    and c.creator_id = p_redeeming_business_id
  for update;

  if not found then
    raise exception 'Offer not found or not owned by the redeeming business';
  end if;

  select origin_business_id into v_origin_business_id
  from wallet_members
  where id = p_member_id;

  if v_origin_business_id is null then
    return query select 0;
    return;
  end if;

  if v_origin_business_id = p_redeeming_business_id then
    return query select 0;
    return;
  end if;

  update businesses set ad_credits = ad_credits - v_bid
  where id = p_redeeming_business_id and ad_credits >= v_bid;

  if not found then
    raise exception 'Insufficient advertiser credits';
  end if;

  update businesses set ad_credits = ad_credits + v_bid
  where id = v_origin_business_id;

  return query select v_bid;
end;
$$;

revoke execute on function claim_ad_credit_transaction_membership(uuid, uuid, uuid) from public;
revoke execute on function claim_ad_credit_transaction_membership(uuid, uuid, uuid) from anon;
revoke execute on function claim_ad_credit_transaction_membership(uuid, uuid, uuid) from authenticated;
grant execute on function claim_ad_credit_transaction_membership(uuid, uuid, uuid) to service_role;
