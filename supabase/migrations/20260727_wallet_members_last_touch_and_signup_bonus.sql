-- ============================================================================
-- Jeeran: last-touch attribution + one-time signup bonus for wallet_members.
--
-- Context: origin_business_id was first-touch-forever — whichever shop's QR
-- stand a customer scanned FIRST kept 100% of their redemption credit for
-- life, even if they never went back and became a regular somewhere else.
-- This migration adds the columns/table/function needed to switch to
-- last-touch (see src/app/api/wallet/membership/create/route.ts for the
-- application-side logic that writes to these).
-- ============================================================================

-- last_touch_at: set whenever origin_business_id changes on a re-scan (i.e.
-- attribution shifts to a new shop). Null for members who have only ever
-- been attributed to their original recruiting shop. This is a record of
-- WHEN attribution last moved, not a general "last seen" timestamp.
alter table wallet_members
  add column if not exists last_touch_at timestamptz;

-- signup_bonus_paid: guards the one-time flat bonus (see pay_signup_bonus()
-- below) against being paid twice for the same member row.
alter table wallet_members
  add column if not exists signup_bonus_paid boolean not null default false;

-- ----------------------------------------------------------------------------
-- wallet_member_touchpoints: append-only log of EVERY scan event — first
-- touch, every re-attribution, and repeat scans of the same shop that don't
-- change attribution at all. Unlike origin_business_id (current attribution
-- only), this is never overwritten, so it's the raw material for later
-- "which shops are customers migrating away from" analytics. Not read by any
-- code yet — write-only until that dashboard work happens.
-- ----------------------------------------------------------------------------
create table if not exists wallet_member_touchpoints (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references wallet_members(id),
  business_id uuid not null references businesses(id),
  scanned_at timestamptz not null default now()
);

create index if not exists wallet_member_touchpoints_member_idx
  on wallet_member_touchpoints (member_id, scanned_at desc);

create index if not exists wallet_member_touchpoints_business_idx
  on wallet_member_touchpoints (business_id, scanned_at desc);

alter table wallet_member_touchpoints enable row level security;
-- Deny-by-default, same posture as wallet_members itself (20260719_wallet_members_geo_rls.sql):
-- only supabaseAdmin (service_role) writes/reads this today. Add a
-- business/admin read policy when the migration-analytics dashboard is built.

-- ----------------------------------------------------------------------------
-- pay_signup_bonus: flat, one-time credit to the business that recruited a
-- brand-new member. Deliberately NOT the FOR UPDATE / two-party transfer
-- pattern used by claim_ad_credit_transaction_membership() — this isn't a
-- transfer between two parties, just a straight credit, so a plain
-- conditional-free UPDATE is enough.
--
-- Anti-gaming: only called from the NEW-member-creation path in
-- src/app/api/wallet/membership/create/route.ts, never from the
-- re-attribution (existing member, different business) path — otherwise a
-- shop could farm repeat bonuses by getting already-registered members to
-- rescan its stand. wallet_members.signup_bonus_paid guards against this
-- same function accidentally firing twice for one member row.
-- ----------------------------------------------------------------------------
create or replace function pay_signup_bonus(
  p_business_id uuid,
  p_amount numeric
)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  update businesses set ad_credits = ad_credits + p_amount where id = p_business_id;
$$;

revoke execute on function pay_signup_bonus(uuid, numeric) from public;
revoke execute on function pay_signup_bonus(uuid, numeric) from anon;
revoke execute on function pay_signup_bonus(uuid, numeric) from authenticated;
grant execute on function pay_signup_bonus(uuid, numeric) to service_role;
