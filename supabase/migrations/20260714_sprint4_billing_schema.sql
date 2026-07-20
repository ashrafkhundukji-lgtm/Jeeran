-- Sprint 4: monetization schema.

-- ── subscription + Stripe linkage ─────────────────────────────────────────
alter table businesses
  add column is_subscription_active boolean not null default false,
  add column stripe_customer_id text,
  add column stripe_subscription_id text;

alter table technicians
  add column is_subscription_active boolean not null default false,
  add column stripe_customer_id text,
  add column stripe_subscription_id text;

create unique index businesses_stripe_customer_idx on businesses(stripe_customer_id) where stripe_customer_id is not null;
create unique index businesses_stripe_subscription_idx on businesses(stripe_subscription_id) where stripe_subscription_id is not null;
create unique index technicians_stripe_customer_idx on technicians(stripe_customer_id) where stripe_customer_id is not null;
create unique index technicians_stripe_subscription_idx on technicians(stripe_subscription_id) where stripe_subscription_id is not null;

-- ── billing ledger ────────────────────────────────────────────────────────
-- stripe_event_id is unique so record_billing_event() can dedupe webhook
-- retries (Stripe delivers "at least once") without double-crediting.
create table billing_transactions (
  id uuid primary key default gen_random_uuid(),
  account_type text not null check (account_type in ('business', 'technician')),
  account_id uuid not null,
  type text not null check (type in ('subscription_initial', 'subscription_renewal', 'topup')),
  stripe_event_id text not null unique,
  amount_usd numeric not null default 0,
  credits_granted integer not null default 0,
  created_at timestamptz not null default now()
);

create index billing_transactions_account_idx on billing_transactions(account_type, account_id);

alter table billing_transactions enable row level security;

create policy "billing_transactions: owner can read" on billing_transactions
  for select using (
    (account_type = 'business' and exists (
      select 1 from businesses b where b.id = billing_transactions.account_id and b.owner_id = auth.uid()
    ))
    or
    (account_type = 'technician' and exists (
      select 1 from technicians t where t.id = billing_transactions.account_id and t.user_id = auth.uid()
    ))
  );
-- No insert/update/delete policy: writes only happen via record_billing_event()
-- (SECURITY DEFINER, service_role only), never directly by clients.

-- ── one active campaign per creator ───────────────────────────────────────
-- PRD: the base subscription lets an account "manage 1 active campaign".
-- A partial unique index is the enforcement mechanism (source of truth);
-- the API layer pre-checks it for a friendly error message instead of a
-- raw constraint-violation.
create unique index campaigns_one_active_per_creator
  on campaigns(creator_type, creator_id)
  where is_active;
