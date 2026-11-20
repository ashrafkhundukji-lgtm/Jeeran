-- ============================================================================
-- Security: close the open routes (fix/security-open-routes).
--
--   1. admin_audit_log       who froze/unfroze a shop or changed platform
--                            settings, and when
--   2. rate_limit_hits +     per-IP (hashed) / per-device limits for the
--      rate_limit_hit()      anonymous Wallet pass routes and the signup bonus
--   3. drop claim_ad_credit_transaction(uuid, uuid, uuid): the credit step of
--      the retired per-offer pass flow. Its only caller, POST
--      /api/wallet/callback, now returns 410. Credits move only through
--      claim_ad_credit_transaction_membership (staff-confirmed /api/redeem).
--
-- RLS on, no policies: both tables are written and read only by the
-- service role on the server. Nothing else changes.
-- ============================================================================

-- ── 1. Admin audit log ──
create table if not exists admin_audit_log (
  id bigint generated always as identity primary key,
  actor_user_id uuid not null references auth.users(id) on delete restrict,
  actor_email text,
  action text not null check (action in ('shop.freeze', 'shop.unfreeze', 'settings.update')),
  target_business_id uuid references businesses(id) on delete set null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_target_idx on admin_audit_log (target_business_id, created_at desc);
create index if not exists admin_audit_log_created_idx on admin_audit_log (created_at desc);

alter table admin_audit_log enable row level security;  -- service role only

comment on table admin_audit_log is
  'Admin actions (freeze/unfreeze, settings). Written by /api/admin/* after the ADMIN_EMAILS check, before the change is applied.';

-- ── 2. Rate limits (anonymous routes) ──
-- key examples: pass:ip:<hmac>, pass:device:<uuid>, bonus:ip:<hmac>:<shop>.
-- Never a raw IP. Rows are pruned per key on every hit and older than 2 days
-- by /api/cron/keepalive.
create table if not exists rate_limit_hits (
  id bigint generated always as identity primary key,
  key text not null check (length(key) <= 200),
  hit_at timestamptz not null default now()
);

create index if not exists rate_limit_hits_key_idx on rate_limit_hits (key, hit_at desc);
create index if not exists rate_limit_hits_hit_at_idx on rate_limit_hits (hit_at);

alter table rate_limit_hits enable row level security;  -- service role only

-- true = allowed (and counted). Serialised per key so concurrent requests
-- can't both take the last slot.
create or replace function rate_limit_hit(p_key text, p_max integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count integer;
begin
  perform pg_advisory_xact_lock(hashtext('rate_limit:' || p_key));
  delete from rate_limit_hits where key = p_key and hit_at <= now() - make_interval(secs => p_window_seconds);
  select count(*) into v_count from rate_limit_hits where key = p_key;
  if v_count >= p_max then
    return false;
  end if;
  insert into rate_limit_hits (key) values (p_key);
  return true;
end;
$$;

revoke execute on function rate_limit_hit(text, integer, integer) from public, anon, authenticated;
grant execute on function rate_limit_hit(text, integer, integer) to service_role;

-- ── 3. Retire the per-offer credit function ──
drop function if exists claim_ad_credit_transaction(uuid, uuid, uuid);
drop function if exists claim_ad_credit_transaction(uuid, uuid);
