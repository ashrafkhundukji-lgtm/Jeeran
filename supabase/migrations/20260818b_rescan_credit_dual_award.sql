-- ============================================================================
-- Phase 2: reverse last-touch attribution, add dual rescan-crediting.
--
-- origin_business_id goes back to permanent (first-touch-forever) — see
-- src/app/api/wallet/membership/create/route.ts, which no longer updates it
-- on a re-scan. last_touch_at is left in place as a historical record of
-- the period last-touch was live, but nothing writes to it going forward.
-- ============================================================================

comment on column wallet_members.last_touch_at is
  'Historical only — last-touch attribution was reversed back to permanent
  first-touch (see 20260818b_rescan_credit_dual_award.sql). This column is
  no longer written to; it just records when attribution last moved during
  the period last-touch was live (2026-07-27 through 2026-08-18).';

-- IP on every touchpoint, same fraud-review-visibility-only pattern as
-- wallet_members.signup_ip (20260726_wallet_members_signup_ip.sql) — not an
-- automatic block, just visibility for manual review.
alter table wallet_member_touchpoints
  add column if not exists scan_ip text;

-- ----------------------------------------------------------------------------
-- rescan_credit_events: one row per actual credit payout from the rescan
-- mechanic (distinct from the one-time signup bonus and redemption credit —
-- see src/lib/wallet/rescan-credit.ts). A same-business rescan (member
-- rescans the shop that originally recruited them) produces TWO rows for
-- one touchpoint — RESCAN_CREDIT and ORIGIN_RESCAN_CREDIT both firing to
-- that one shop, per product decision: no separate "double" formula, both
-- awards simply trigger together. Existing as its own ledger (rather than
-- boolean flags on wallet_member_touchpoints) makes the daily per-business
-- cap a plain count query regardless of which role (scanned vs. origin)
-- earned the credit.
-- ----------------------------------------------------------------------------
create table if not exists rescan_credit_events (
  id uuid primary key default gen_random_uuid(),
  touchpoint_id uuid not null references wallet_member_touchpoints(id),
  member_id uuid not null references wallet_members(id),
  business_id uuid not null references businesses(id),
  role text not null check (role in ('scanned', 'origin')),
  amount numeric not null,
  created_at timestamptz not null default now()
);

create index if not exists rescan_credit_events_business_idx
  on rescan_credit_events (business_id, created_at desc);

alter table rescan_credit_events enable row level security;
-- Deny-by-default, same posture as wallet_member_touchpoints/wallet_members —
-- only supabaseAdmin (service_role) writes/reads this today.

-- pay_rescan_credit: flat, one-time credit — same shape as pay_signup_bonus
-- (20260727_wallet_members_last_touch_and_signup_bonus.sql). Not the FOR
-- UPDATE / two-party transfer pattern used by
-- claim_ad_credit_transaction_membership(); this isn't a transfer between
-- two parties, just a straight credit.
create or replace function pay_rescan_credit(
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

revoke execute on function pay_rescan_credit(uuid, numeric) from public;
revoke execute on function pay_rescan_credit(uuid, numeric) from anon;
revoke execute on function pay_rescan_credit(uuid, numeric) from authenticated;
grant execute on function pay_rescan_credit(uuid, numeric) to service_role;
