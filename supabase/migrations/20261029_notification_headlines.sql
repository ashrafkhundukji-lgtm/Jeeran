-- ============================================================================
-- Wallet notifications: headline model.
-- Spec: docs/design/wallet-notification-headlines-spec.md
--
-- Replaces the once-daily 06:00 batch (20260820_notification_batching.sql)
-- with two send windows (12:30 and 19:30 Riyadh, fired by pg_cron — see the
-- spec) where each ping has ONE headline shop plus up to two "also near you"
-- names. Who gets the headline:
--   1. a shop whose first offer went live in the last N days is introduced
--      once to each nearby member;
--   2. otherwise a draw weighted by bid × freshness × distance;
--   3. a shop can't be a member's headline twice within N days unless its
--      offer content changed since.
-- Card content and ranking (nearby_active_offers) are untouched.
--
-- Pieces:
--   1. campaigns.content_changed_at — when the offer's CONTENT last changed.
--      updated_at also moves on toggles and bid edits, which must not
--      re-earn a "new offer" boost or reset the repeat limit.
--   2. notification_headlines — one row per ping sent (window or Instant
--      Notify), with the shops it mentioned. Drives the repeat limit, the
--      one-time intro, and the owner's "seen on lock screens" numbers.
--   3. notification_candidates() — every live offer within a member's
--      reach, with what the draw needs (bid, content_changed_at, the shop's
--      first-offer time). Same eligibility as nearby_active_offers(), minus
--      frozen shops, and no LIMIT: the draw must see every shop, not the
--      card's top 5.
--   4. promotion_settings knobs (admin-tunable, no code change).
--   5. get_owner_notification_metrics() for the owner dashboard.
-- ============================================================================

-- ── 1. campaigns.content_changed_at ──
alter table campaigns add column if not exists content_changed_at timestamptz;
update campaigns set content_changed_at = coalesce(updated_at, created_at) where content_changed_at is null;
alter table campaigns alter column content_changed_at set default now();
alter table campaigns alter column content_changed_at set not null;

comment on column campaigns.content_changed_at is
  'When the offer''s customer-visible content (title, description, image, per-language overrides) last changed. Unlike updated_at it does not move on is_active toggles or bid edits. Used by the notification headline draw (freshness boost, repeat-limit override).';

create or replace function set_campaign_content_changed_at()
returns trigger
language plpgsql
as $$
begin
  if new.title is distinct from old.title
     or new.description is distinct from old.description
     or new.image_url is distinct from old.image_url
     or new.title_ar is distinct from old.title_ar
     or new.title_en is distinct from old.title_en
     or new.title_ur is distinct from old.title_ur
     or new.description_ar is distinct from old.description_ar
     or new.description_en is distinct from old.description_en
     or new.description_ur is distinct from old.description_ur then
    new.content_changed_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists campaigns_set_content_changed_at on campaigns;
create trigger campaigns_set_content_changed_at
  before update on campaigns
  for each row
  execute function set_campaign_content_changed_at();

-- ── 2. notification_headlines ──
create table if not exists notification_headlines (
  id bigint generated always as identity primary key,
  member_id uuid not null references wallet_members(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  offer_id uuid references campaigns(id) on delete set null,
  kind text not null check (kind in ('intro', 'draw', 'instant')),
  mentioned_business_ids uuid[] not null default '{}',
  sent_at timestamptz not null default now()
);

create index if not exists notification_headlines_member_idx on notification_headlines (member_id, sent_at desc);
create index if not exists notification_headlines_business_idx on notification_headlines (business_id, sent_at desc);
create index if not exists notification_headlines_mentions_idx on notification_headlines using gin (mentioned_business_ids);

comment on table notification_headlines is
  'One row per lock-screen ping sent to a wallet member: the headline shop/offer, why it won (intro = new-shop introduction, draw = bid-weighted draw, instant = Instant Notify add-on) and the shops named under "also near you". Written by src/lib/wallet/geo-notify.ts (service role only).';

alter table notification_headlines enable row level security;
-- No policies: written and read only by the service role (cron, owner
-- dashboard server component via get_owner_notification_metrics()).

-- ── 3. notification_candidates ──
create or replace function notification_candidates(
  p_lat double precision,
  p_lng double precision,
  p_radius_km numeric
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
  description_ur text,
  bid_per_view integer,
  content_changed_at timestamptz,
  business_first_offer_at timestamptz
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
  from campaigns c
  join businesses b on b.id = c.creator_id and c.creator_type = 'business'
  where c.is_active = true
    and offer_in_date_window(c.start_date, c.end_date)
    and not b.is_frozen
    and b.geog is not null
    and ST_DWithin(
      b.geog,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
      greatest(p_radius_km, business_reach_radius_km(b.id)) * 1000
    );
$$;

revoke execute on function notification_candidates(double precision, double precision, numeric) from public, anon, authenticated;
grant execute on function notification_candidates(double precision, double precision, numeric) to service_role;

-- ── 4. Tunable knobs ──
-- Send TIMES are not here: they're the pg_cron schedules (see the spec).
-- max_daily_wallet_notifications (Google's 3/24h cap, 0 = pause) stays the
-- shared slot ceiling, including Instant Notify.
alter table promotion_settings
  add column if not exists notify_boost_factor numeric not null default 3 check (notify_boost_factor >= 1),
  add column if not exists notify_boost_hours int not null default 48 check (notify_boost_hours between 0 and 336),
  add column if not exists notify_repeat_days int not null default 7 check (notify_repeat_days between 0 and 60),
  add column if not exists notify_new_shop_days int not null default 7 check (notify_new_shop_days between 0 and 60),
  add column if not exists notify_daily_base int not null default 1 check (notify_daily_base between 0 and 2),
  add column if not exists notify_daily_with_news int not null default 2 check (notify_daily_with_news between 0 and 2);

comment on column promotion_settings.notify_daily_base is
  'Window pings per member per Riyadh day for an ordinary bid-weighted draw. notify_daily_with_news allows one more when the pick is a new-shop introduction (not for boosted offers: in a busy area some shop has always just edited its offer, which would mean two pings every day).';

-- ── 5. Owner metrics ──
create or replace function get_owner_notification_metrics(p_business_id uuid)
returns table (headlines_total bigint, headlines_this_week bigint, headlines_last_week bigint, mentions_this_week bigint)
language sql
stable
set search_path = public, pg_temp
as $$
  select
    (select count(*) from notification_headlines h where h.business_id = p_business_id),
    (select count(*) from notification_headlines h where h.business_id = p_business_id and h.sent_at >= now() - interval '7 days'),
    (select count(*) from notification_headlines h where h.business_id = p_business_id
       and h.sent_at >= now() - interval '14 days' and h.sent_at < now() - interval '7 days'),
    (select count(*) from notification_headlines h where p_business_id = any (h.mentioned_business_ids)
       and h.sent_at >= now() - interval '7 days');
$$;

revoke execute on function get_owner_notification_metrics(uuid) from public, anon, authenticated;
grant execute on function get_owner_notification_metrics(uuid) to service_role;
