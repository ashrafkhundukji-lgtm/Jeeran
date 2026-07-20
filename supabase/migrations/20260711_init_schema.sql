-- Jeeran Network — initial schema (Sprint 1)
-- Tables: profiles, businesses, technicians, campaigns, scans_and_claims

-- ── profiles ──────────────────────────────────────────────────────────────
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'owner' check (role in ('owner', 'technician')),
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles: read own" on profiles
  for select using (auth.uid() = id);
create policy "profiles: update own" on profiles
  for update using (auth.uid() = id);

-- ── businesses ────────────────────────────────────────────────────────────
create table businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  category text not null, -- e.g. 'cafe', 'salon', 'dry-clean', 'hardware'
  latitude numeric,
  longitude numeric,
  ad_credits integer not null default 100 check (ad_credits >= 0),
  qr_code_url text,
  created_at timestamptz not null default now()
);

create index businesses_category_idx on businesses(category);
create index businesses_owner_idx on businesses(owner_id);

alter table businesses enable row level security;

create policy "businesses: owner full access" on businesses
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- ── technicians ───────────────────────────────────────────────────────────
create table technicians (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  specialty text, -- e.g. 'electrician', 'plumber', 'carpenter'
  linked_business_id uuid references businesses(id) on delete set null,
  ad_credits integer not null default 50 check (ad_credits >= 0)
);

create index technicians_user_idx on technicians(user_id);

alter table technicians enable row level security;

create policy "technicians: owner full access" on technicians
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── campaigns ─────────────────────────────────────────────────────────────
-- NOTE: the PRD describes creator_id as polymorphic ("business_id or
-- technician_id"). A raw uuid with no discriminator can't be joined safely
-- or given a real FK, and the matchmaking credit-check needs to know which
-- table to pull ad_credits from — so creator_type was added here as the
-- minimum needed to make that join and the RLS ownership check work.
create table campaigns (
  id uuid primary key default gen_random_uuid(),
  creator_type text not null check (creator_type in ('business', 'technician')),
  creator_id uuid not null,
  title text not null,
  description text,
  bid_per_view integer not null default 2 check (bid_per_view > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index campaigns_creator_idx on campaigns(creator_type, creator_id);
create index campaigns_active_idx on campaigns(is_active) where is_active;

alter table campaigns enable row level security;

create policy "campaigns: creator full access" on campaigns
  for all using (
    (creator_type = 'business' and exists (
      select 1 from businesses b where b.id = campaigns.creator_id and b.owner_id = auth.uid()
    ))
    or
    (creator_type = 'technician' and exists (
      select 1 from technicians t where t.id = campaigns.creator_id and t.user_id = auth.uid()
    ))
  )
  with check (
    (creator_type = 'business' and exists (
      select 1 from businesses b where b.id = campaigns.creator_id and b.owner_id = auth.uid()
    ))
    or
    (creator_type = 'technician' and exists (
      select 1 from technicians t where t.id = campaigns.creator_id and t.user_id = auth.uid()
    ))
  );

-- ── scans_and_claims ──────────────────────────────────────────────────────
-- Ledger of ad claims. Written only by trusted server-side code (service
-- role, bypasses RLS) as part of the claim transaction — no client insert
-- policy is defined, so authenticated/anon clients cannot write entries or
-- self-credit directly.
create table scans_and_claims (
  id uuid primary key default gen_random_uuid(),
  host_business_id uuid not null references businesses(id) on delete cascade,
  campaign_id uuid not null references campaigns(id) on delete cascade,
  credits_transferred integer not null,
  created_at timestamptz not null default now()
);

create index scans_host_business_idx on scans_and_claims(host_business_id);
create index scans_campaign_idx on scans_and_claims(campaign_id);

alter table scans_and_claims enable row level security;

create policy "scans: host business owner can read" on scans_and_claims
  for select using (
    exists (select 1 from businesses b where b.id = scans_and_claims.host_business_id and b.owner_id = auth.uid())
  );
