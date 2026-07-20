-- Launch strategy: every new shop gets a 3-month trial, counted from its
-- onboarding date. is_subscription_active is reused as-is (get_top_ads,
-- SubscriptionBanner, admin overview all already gate on it) so the trial
-- just becomes another way that column gets set true, instead of a paid
-- Stripe subscription. No changes needed to those readers.

alter table businesses
  add column trial_ends_at timestamptz not null default (now() + interval '3 months'),
  add column trial_notified_at timestamptz;

-- Backfill: existing shops' trial should count from when they actually
-- joined, not from today.
update businesses set trial_ends_at = created_at + interval '3 months';

-- New shops are subscription-active by default now (via trial), not false.
alter table businesses alter column is_subscription_active set default true;

-- Backfill: turn on trial-active shops that haven't paid and are still
-- inside their (backfilled) trial window. Leaves already-active (paid)
-- rows and already-expired rows alone.
update businesses
set is_subscription_active = true
where is_subscription_active = false
  and stripe_subscription_id is null
  and trial_ends_at > now();

-- expire_lapsed_trials: flips is_subscription_active off for any shop whose
-- trial has ended without a paid Stripe subscription. Meant to be called
-- once a day by an external cron hitting /api/cron/trials.
create or replace function expire_lapsed_trials()
returns integer
language sql
security definer
set search_path = public, pg_temp
as $$
  with expired as (
    update businesses
    set is_subscription_active = false
    where is_subscription_active = true
      and stripe_subscription_id is null
      and trial_ends_at <= now()
    returning id
  )
  select count(*)::integer from expired;
$$;

revoke execute on function expire_lapsed_trials() from public;
revoke execute on function expire_lapsed_trials() from anon;
revoke execute on function expire_lapsed_trials() from authenticated;
grant execute on function expire_lapsed_trials() to service_role;

-- businesses_due_trial_warning: shops within 7 days of trial end, unpaid,
-- not yet warned. The cron route emails each of these then calls
-- mark_trial_warning_sent so a retry/redeploy can't double-send.
create or replace function businesses_due_trial_warning()
returns table (id uuid, owner_id uuid, name text, trial_ends_at timestamptz)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select id, owner_id, name, trial_ends_at
  from businesses
  where stripe_subscription_id is null
    and trial_notified_at is null
    and trial_ends_at > now()
    and trial_ends_at <= now() + interval '7 days';
$$;

revoke execute on function businesses_due_trial_warning() from public;
revoke execute on function businesses_due_trial_warning() from anon;
revoke execute on function businesses_due_trial_warning() from authenticated;
grant execute on function businesses_due_trial_warning() to service_role;

create or replace function mark_trial_warning_sent(p_business_id uuid)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  update businesses set trial_notified_at = now() where id = p_business_id;
$$;

revoke execute on function mark_trial_warning_sent(uuid) from public;
revoke execute on function mark_trial_warning_sent(uuid) from anon;
revoke execute on function mark_trial_warning_sent(uuid) from authenticated;
grant execute on function mark_trial_warning_sent(uuid) to service_role;
