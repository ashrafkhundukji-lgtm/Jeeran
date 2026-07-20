-- Sprint 3: redemption tracking, bid range, missing profiles INSERT policy.

-- ── scans_and_claims: redemption state ───────────────────────────────────
-- claim_token is minted client-side (by /api/wallet/generate) and threaded
-- through to the ledger transaction, so each individual pass — not just
-- each campaign+host pair — is uniquely identifiable and redeemable once.
-- See src/lib/wallet/hmac.ts for why this replaced the campaign+host hash
-- from Sprint 2 (that scheme couldn't distinguish two different customers'
-- passes for the same campaign/host, so double-spend prevention was
-- unenforceable).
alter table scans_and_claims
  add column claim_token uuid unique,
  add column is_redeemed boolean not null default false,
  add column redeemed_at timestamptz;

-- ── campaigns: bid range per Sprint 3's slider spec (2-10 credits) ───────
alter table campaigns drop constraint campaigns_bid_per_view_check;
alter table campaigns add constraint campaigns_bid_per_view_check check (bid_per_view between 2 and 10);

-- ── profiles: missing INSERT policy ──────────────────────────────────────
-- Sprint 1 only gave profiles SELECT/UPDATE policies, so a signed-in user
-- had no way to create their own profile row during onboarding under RLS.
create policy "profiles: insert own" on profiles
  for insert with check (auth.uid() = id);

-- ── claim_ad_credit_transaction: accept + store the claim token ─────────
create or replace function claim_ad_credit_transaction(
  p_host_business_id uuid,
  p_campaign_id uuid,
  p_claim_token uuid
)
returns table (credits_transferred integer, claim_id uuid)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_creator_type text;
  v_creator_id uuid;
  v_bid integer;
  v_claim_id uuid;
begin
  select c.creator_type, c.creator_id, c.bid_per_view
    into v_creator_type, v_creator_id, v_bid
  from campaigns c
  where c.id = p_campaign_id and c.is_active
  for update;

  if not found then
    raise exception 'Campaign not found or inactive';
  end if;

  if v_creator_type = 'business' then
    update businesses set ad_credits = ad_credits - v_bid
    where id = v_creator_id and ad_credits >= v_bid;
  else
    update technicians set ad_credits = ad_credits - v_bid
    where id = v_creator_id and ad_credits >= v_bid;
  end if;

  if not found then
    raise exception 'Insufficient advertiser credits';
  end if;

  update businesses set ad_credits = ad_credits + v_bid
  where id = p_host_business_id;

  if not found then
    raise exception 'Host business not found';
  end if;

  insert into scans_and_claims (host_business_id, campaign_id, credits_transferred, claim_token)
  values (p_host_business_id, p_campaign_id, v_bid, p_claim_token)
  returning id into v_claim_id;

  return query select v_bid, v_claim_id;
end;
$$;

-- old 2-arg signature is superseded — drop it so nothing can call the
-- pre-Sprint-3 version that doesn't record a claim_token.
drop function if exists claim_ad_credit_transaction(uuid, uuid);

revoke execute on function claim_ad_credit_transaction(uuid, uuid, uuid) from public;
revoke execute on function claim_ad_credit_transaction(uuid, uuid, uuid) from anon;
revoke execute on function claim_ad_credit_transaction(uuid, uuid, uuid) from authenticated;
grant execute on function claim_ad_credit_transaction(uuid, uuid, uuid) to service_role;
