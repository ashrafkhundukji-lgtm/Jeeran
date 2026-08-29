-- ============================================================================
-- Instant Notify add-on: a paid Stripe subscription add-on (separate Product/
-- Price from the base subscription) that lets a premium business's campaign
-- fire its lock-screen push IMMEDIATELY (at activate/toggle/edit time)
-- instead of waiting for the once-daily sendDailyNotificationBatch(), and
-- claim a notification slot ahead of non-premium contenders for that same
-- member. Confirmed design (see conversation): contention between multiple
-- premium businesses on the same member/day is resolved FCFS by claim
-- timestamp; "guarantee" is scoped to whatever slots haven't been consumed
-- yet that calendar day — it cannot un-send a push the batch already sent
-- earlier, since Google's 3-per-object/24h cap
-- (20260820_notification_batching.sql) is a real, unbypassable ceiling.
--
-- Three pieces:
--   1. business_addons — generic add-on subscription tracking, deliberately
--      NOT reusing businesses.stripe_subscription_id/is_subscription_active
--      (those are the base subscription's columns, unique-indexed 1:1 with a
--      business, and is_subscription_active gates campaign eligibility in
--      get_top_ads() — conflating the two would let an add-on purchase/
--      cancellation accidentally flip base-subscription campaign
--      eligibility). Keyed by (business_id, addon_key) so future add-ons
--      reuse this same table instead of growing more one-off boolean
--      columns on businesses.
--   2. wallet_members.notifications_sent_date/notifications_sent_count — the
--      daily slot ledger that did NOT exist before this migration.
--      sendDailyNotificationBatch previously enforced the 3/day cap only by
--      assuming it's the sole sender and runs exactly once/day
--      (candidates.slice(0, cap) in that one run — see
--      20260820_notification_batching.sql). The instant-notify path breaks
--      that assumption (it can send at any time of day, outside the batch),
--      so an explicit per-member per-day counter is now required — read/
--      written by BOTH the instant path and the batch via
--      claim_notification_slot(), so the two together can never exceed the
--      shared cap.
--   3. record_addon_billing_event / claim_notification_slot /
--      release_notification_slot — new functions; set_subscription_status is
--      extended (CREATE OR REPLACE, same signature) to also deactivate a
--      matching business_addons row on customer.subscription.deleted.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- business_addons
-- ----------------------------------------------------------------------------
create table if not exists business_addons (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  addon_key text not null,
  is_active boolean not null default false,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, addon_key)
);

create unique index if not exists business_addons_stripe_subscription_idx
  on business_addons(stripe_subscription_id) where stripe_subscription_id is not null;

comment on table business_addons is
  'Generic per-business add-on subscription tracking (currently just instant_notify), separate from businesses.stripe_subscription_id/is_subscription_active (the base subscription) so an add-on''s lifecycle can never accidentally affect base-subscription campaign eligibility (get_top_ads()). One row per (business_id, addon_key); is_active mirrors the underlying Stripe subscription''s status via the billing webhook.';

alter table business_addons enable row level security;

create policy "business_addons: owner can read" on business_addons
  for select using (
    exists (select 1 from businesses b where b.id = business_addons.business_id and b.owner_id = auth.uid())
  );
-- No insert/update/delete policy: writes only happen via the billing webhook
-- (service_role) through record_addon_billing_event()/set_subscription_status()
-- below, same posture as billing_transactions.

-- ----------------------------------------------------------------------------
-- billing_transactions.addon_key — lets the ledger (and BillingView's
-- history list) tell an add-on payment apart from a base-subscription
-- payment; both otherwise share the same type values
-- ('subscription_initial'/'subscription_renewal') since an add-on charge is
-- still fundamentally a subscription event, just for a different product.
-- Null for every existing/base-subscription/topup row.
-- ----------------------------------------------------------------------------
alter table billing_transactions add column if not exists addon_key text;

comment on column billing_transactions.addon_key is
  'Set only for add-on billing events (e.g. instant_notify), written by record_addon_billing_event(); null for base-subscription/topup rows written by record_billing_event(), so the ledger UI can distinguish them despite sharing the same type values.';

-- ----------------------------------------------------------------------------
-- wallet_members: per-day notification slot ledger
-- ----------------------------------------------------------------------------
alter table wallet_members
  add column if not exists notifications_sent_date date,
  add column if not exists notifications_sent_count int not null default 0;

comment on column wallet_members.notifications_sent_count is
  'How many lock-screen notification slots this member has consumed on notifications_sent_date (treated as 0 once notifications_sent_date != current_date — there is no separate reset job). The shared ledger claim_notification_slot()/release_notification_slot() check and adjust atomically, read by BOTH the instant-notify add-on path (src/lib/wallet/geo-notify.ts notifyInstantOffer) and the once-daily batch (notifyMemberBatch), so the two paths can never together exceed promotion_settings.max_daily_wallet_notifications / Google''s hard 3-per-object/24h cap.';

-- ----------------------------------------------------------------------------
-- claim_notification_slot: atomically checks-and-increments a member's
-- today's-count, gated by p_cap. A single row-locked UPDATE — Postgres
-- serializes concurrent claims against the same member row, so when two
-- premium businesses' events race for the same member's last open slot, the
-- transaction that commits first genuinely wins (first-come-first-served by
-- claim timestamp, the confirmed contention-resolution rule) with no
-- additional locking needed. Returns false (not null) on a failed claim —
-- day rollover is handled inline (a stale notifications_sent_date resets the
-- count to 1 on the first claim of the new day) rather than by a separate
-- cron.
-- ----------------------------------------------------------------------------
create or replace function claim_notification_slot(p_member_id uuid, p_cap int)
returns boolean
language sql
security definer
set search_path = public, pg_temp
as $$
  with claimed as (
    update wallet_members
      set notifications_sent_count = case
            when notifications_sent_date = current_date then notifications_sent_count + 1
            else 1
          end,
          notifications_sent_date = current_date
      where id = p_member_id
        and (notifications_sent_date is distinct from current_date or notifications_sent_count < p_cap)
      returning true as ok
  )
  select coalesce((select ok from claimed), false);
$$;

revoke execute on function claim_notification_slot(uuid, int) from public;
revoke execute on function claim_notification_slot(uuid, int) from anon;
revoke execute on function claim_notification_slot(uuid, int) from authenticated;
grant execute on function claim_notification_slot(uuid, int) to service_role;

-- ----------------------------------------------------------------------------
-- release_notification_slot: compensating action for claim_notification_slot
-- when the claimed slot's send (notifyNewOffer) actually fails after the
-- claim succeeded — without this, a transient Google API error would
-- permanently burn a slot from the day's shared budget for nothing. No-ops
-- once the day has rolled over (never touches a stale notifications_sent_date),
-- and never goes below 0.
-- ----------------------------------------------------------------------------
create or replace function release_notification_slot(p_member_id uuid)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  update wallet_members
    set notifications_sent_count = greatest(notifications_sent_count - 1, 0)
    where id = p_member_id and notifications_sent_date = current_date;
$$;

revoke execute on function release_notification_slot(uuid) from public;
revoke execute on function release_notification_slot(uuid) from anon;
revoke execute on function release_notification_slot(uuid) from authenticated;
grant execute on function release_notification_slot(uuid) to service_role;

-- ----------------------------------------------------------------------------
-- record_addon_billing_event: record_billing_event()'s counterpart for
-- add-ons — same idempotent-ledger-write shape (dedupes on stripe_event_id
-- via billing_transactions' unique constraint, so a webhook retry can't
-- double-activate), but flips business_addons.is_active rather than
-- businesses.ad_credits/is_subscription_active. credits_granted is always 0
-- — add-ons don't grant ad credits.
-- ----------------------------------------------------------------------------
create or replace function record_addon_billing_event(
  p_business_id uuid,
  p_addon_key text,
  p_type text,
  p_stripe_event_id text,
  p_amount_usd numeric
)
returns table (already_processed boolean)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_inserted_id uuid;
begin
  insert into billing_transactions (account_type, account_id, type, stripe_event_id, amount_usd, credits_granted, addon_key)
  values ('business', p_business_id, p_type, p_stripe_event_id, p_amount_usd, 0, p_addon_key)
  on conflict (stripe_event_id) do nothing
  returning id into v_inserted_id;

  if v_inserted_id is null then
    return query select true;
    return;
  end if;

  update business_addons
    set is_active = true, updated_at = now()
    where business_id = p_business_id and addon_key = p_addon_key;

  return query select false;
end;
$$;

revoke execute on function record_addon_billing_event(uuid, text, text, text, numeric) from public;
revoke execute on function record_addon_billing_event(uuid, text, text, text, numeric) from anon;
revoke execute on function record_addon_billing_event(uuid, text, text, text, numeric) from authenticated;
grant execute on function record_addon_billing_event(uuid, text, text, text, numeric) to service_role;

-- ----------------------------------------------------------------------------
-- set_subscription_status: extended (same signature — CREATE OR REPLACE, no
-- DROP needed, existing grants carry over unchanged) to also deactivate a
-- matching business_addons row on customer.subscription.deleted, so the
-- webhook doesn't need a second RPC call for the add-on case — a
-- stripe_subscription_id can only ever match one of businesses/technicians/
-- business_addons, same reasoning the original comment already gives for
-- checking both existing tables unconditionally.
-- ----------------------------------------------------------------------------
create or replace function set_subscription_status(
  p_stripe_subscription_id text,
  p_active boolean
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update businesses set is_subscription_active = p_active where stripe_subscription_id = p_stripe_subscription_id;
  update technicians set is_subscription_active = p_active where stripe_subscription_id = p_stripe_subscription_id;
  update business_addons set is_active = p_active, updated_at = now() where stripe_subscription_id = p_stripe_subscription_id;
end;
$$;
