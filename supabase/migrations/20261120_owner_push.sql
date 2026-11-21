-- ============================================================================
-- Owner app (phase 1): Web Push for shop owners.
--
-- Additive only: five new tables and five new functions. No existing table,
-- function, trigger or policy is changed.
--
--   owner_push_subscriptions   one row per phone/browser (push endpoint)
--   owner_notification_prefs   per-shop toggles + the language pushes use
--   owner_push_log             what was sent (throttle + "new customers" count)
--   owner_offer_state          last known "is my offer showing" state, so the
--                              "offer stopped showing" push fires once per change
--   owner_push_api_hits        rate limit for the owner push API routes
--
-- RLS is on for all five. Owners may read/delete only their own
-- subscriptions and read their own preferences. Everything else (insert,
-- update, sending, logs, state) goes through the service role from
-- server-side code after the API route has checked who the caller is.
-- ============================================================================

-- ── 1. Subscriptions ──
create table if not exists owner_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  endpoint text not null unique
    check (endpoint like 'https://%' and length(endpoint) <= 1024),
  p256dh text not null check (length(p256dh) between 16 and 200),
  auth text not null check (length(auth) between 8 and 100),
  user_agent_label text check (length(user_agent_label) <= 80),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

create index if not exists owner_push_subscriptions_business_idx
  on owner_push_subscriptions (business_id) where enabled;
create index if not exists owner_push_subscriptions_owner_idx
  on owner_push_subscriptions (owner_id);

alter table owner_push_subscriptions enable row level security;

drop policy if exists "owner_push_subscriptions: owner can read" on owner_push_subscriptions;
create policy "owner_push_subscriptions: owner can read" on owner_push_subscriptions
  for select to authenticated using (owner_id = auth.uid());

drop policy if exists "owner_push_subscriptions: owner can delete" on owner_push_subscriptions;
create policy "owner_push_subscriptions: owner can delete" on owner_push_subscriptions
  for delete to authenticated using (owner_id = auth.uid());

-- ── 2. Preferences (one row per shop; absent row = everything on, Arabic) ──
create table if not exists owner_notification_prefs (
  business_id uuid primary key references businesses(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  locale text not null default 'ar' check (locale in ('ar', 'en', 'ur')),
  redeemed boolean not null default true,      -- 1. a customer redeemed your offer
  earned boolean not null default true,        -- 2. a customer you brought redeemed elsewhere
  signups boolean not null default true,       -- 3. new customers joined through your QR stand
  offer_status boolean not null default true,  -- 4. your offer stopped showing
  trial boolean not null default true,         -- 5. trial ending soon
  updated_at timestamptz not null default now()
);

alter table owner_notification_prefs enable row level security;

drop policy if exists "owner_notification_prefs: owner can read" on owner_notification_prefs;
create policy "owner_notification_prefs: owner can read" on owner_notification_prefs
  for select to authenticated using (owner_id = auth.uid());

-- ── 3. Send log: throttle + the signups collapse ──
create table if not exists owner_push_log (
  id bigint generated always as identity primary key,
  business_id uuid not null references businesses(id) on delete cascade,
  type text not null check (type in ('redeemed', 'earned', 'signups', 'offer_status', 'trial', 'test')),
  sent_at timestamptz not null default now()
);

create index if not exists owner_push_log_lookup_idx on owner_push_log (business_id, type, sent_at desc);

alter table owner_push_log enable row level security;  -- no policies: service role only

-- ── 4. "Is my offer showing" state ──
create table if not exists owner_offer_state (
  business_id uuid primary key references businesses(id) on delete cascade,
  eligible boolean not null,
  reason text,
  changed_at timestamptz not null default now()
);

alter table owner_offer_state enable row level security;  -- service role only

-- ── 5. API rate limit ──
create table if not exists owner_push_api_hits (
  id bigint generated always as identity primary key,
  key text not null check (length(key) <= 200),
  hit_at timestamptz not null default now()
);

create index if not exists owner_push_api_hits_key_idx on owner_push_api_hits (key, hit_at desc);

alter table owner_push_api_hits enable row level security;  -- service role only

-- ── 6. Functions (service role only) ──

create or replace function claim_owner_push_slot(
  p_business_id uuid,
  p_type text,
  p_max integer,
  p_window_seconds integer
)
returns table (claimed boolean, previous_sent_at timestamptz)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count integer;
  v_prev timestamptz;
begin
  perform pg_advisory_xact_lock(hashtext('owner_push:' || p_business_id::text || ':' || p_type));

  select max(sent_at) into v_prev
  from owner_push_log where business_id = p_business_id and type = p_type;

  select count(*) into v_count
  from owner_push_log
  where business_id = p_business_id and type = p_type
    and sent_at > now() - make_interval(secs => p_window_seconds);

  if v_count >= p_max then
    return query select false, v_prev;
    return;
  end if;

  insert into owner_push_log (business_id, type) values (p_business_id, p_type);
  return query select true, v_prev;
end;
$$;

create or replace function owner_offer_eligibility(p_business_id uuid)
returns table (eligible boolean, reason text, offer_id uuid, offer_title text)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  b businesses;
  c campaigns;
  v_any_offer boolean;
begin
  select * into b from businesses where id = p_business_id;
  if not found then
    return;
  end if;

  select cc.* into c
  from eligible_offers() e join campaigns cc on cc.id = e.offer_id
  where e.business_id = p_business_id
  limit 1;
  if found then
    return query select true, null::text, c.id, c.title;
    return;
  end if;

  select exists (
    select 1 from campaigns where creator_type = 'business' and creator_id = p_business_id
  ) into v_any_offer;

  select cc.* into c
  from campaigns cc
  where cc.creator_type = 'business' and cc.creator_id = p_business_id
  order by cc.is_active desc, cc.updated_at desc nulls last
  limit 1;

  return query select
    false,
    case
      when b.is_frozen then 'frozen'
      when not shop_is_exposed(b) then 'subscription'
      when not v_any_offer then 'no_offer'
      when not c.is_active then 'switched_off'
      when c.start_date is not null and c.start_date > current_date then 'not_started'
      when not offer_in_date_window(c.start_date, c.end_date) then 'ended'
      when b.ad_credits < c.bid_per_view then 'credits'
      else 'unknown'
    end,
    c.id,
    c.title;
end;
$$;

create or replace function record_owner_offer_state(p_business_id uuid)
returns table (changed boolean, eligible boolean, reason text, offer_id uuid, offer_title text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_now record;
  v_prev owner_offer_state;
begin
  select * into v_now from owner_offer_eligibility(p_business_id);
  if not found then
    return;
  end if;

  select * into v_prev from owner_offer_state where business_id = p_business_id for update;

  if not found then
    insert into owner_offer_state (business_id, eligible, reason)
    values (p_business_id, v_now.eligible, v_now.reason)
    on conflict (business_id) do nothing;
    return query select false, v_now.eligible, v_now.reason, v_now.offer_id, v_now.offer_title;
    return;
  end if;

  if v_prev.eligible = v_now.eligible and v_prev.reason is not distinct from v_now.reason then
    return query select false, v_now.eligible, v_now.reason, v_now.offer_id, v_now.offer_title;
    return;
  end if;

  update owner_offer_state
  set eligible = v_now.eligible, reason = v_now.reason, changed_at = now()
  where business_id = p_business_id;

  return query select (not v_now.eligible), v_now.eligible, v_now.reason, v_now.offer_id, v_now.offer_title;
end;
$$;

create or replace function owner_push_api_hit(p_key text, p_max integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count integer;
begin
  perform pg_advisory_xact_lock(hashtext('owner_push_api:' || p_key));
  delete from owner_push_api_hits where key = p_key and hit_at <= now() - make_interval(secs => p_window_seconds);
  select count(*) into v_count from owner_push_api_hits where key = p_key;
  if v_count >= p_max then
    return false;
  end if;
  insert into owner_push_api_hits (key) values (p_key);
  return true;
end;
$$;

create or replace function owner_offer_state_sweep_ids()
returns table (business_id uuid)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select business_id from owner_offer_state
  union
  select distinct creator_id from campaigns where creator_type = 'business' and is_active
$$;

revoke execute on function claim_owner_push_slot(uuid, text, integer, integer) from public, anon, authenticated;
revoke execute on function owner_offer_eligibility(uuid) from public, anon, authenticated;
revoke execute on function record_owner_offer_state(uuid) from public, anon, authenticated;
revoke execute on function owner_push_api_hit(text, integer, integer) from public, anon, authenticated;
revoke execute on function owner_offer_state_sweep_ids() from public, anon, authenticated;
grant execute on function claim_owner_push_slot(uuid, text, integer, integer) to service_role;
grant execute on function owner_offer_eligibility(uuid) to service_role;
grant execute on function record_owner_offer_state(uuid) to service_role;
grant execute on function owner_push_api_hit(text, integer, integer) to service_role;
grant execute on function owner_offer_state_sweep_ids() to service_role;