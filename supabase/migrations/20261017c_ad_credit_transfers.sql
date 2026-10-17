-- ============================================================================
-- Ledger for redemption credit transfers.
--
-- claim_ad_credit_transaction_membership() moves bid_per_view credits from
-- the redeeming shop (advertiser) to the shop that recruited the customer,
-- but wrote no record of it: owners saw their balance drop with nothing in
-- their billing history, and there was no per-offer "spent". This adds one
-- row per transfer, written in the SAME transaction as the two balance
-- updates (so it can never disagree with them). Transfer logic itself is
-- unchanged: same checks, same amounts, same no-op cases (no recruiter,
-- self-recruited), same exceptions.
--
-- No backfill: past transfers can't be reconstructed reliably (a failed
-- transfer raised and was swallowed by /api/redeem, leaving no trace).
-- ============================================================================

create table if not exists ad_credit_transfers (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid references campaigns(id) on delete set null,
  from_business_id uuid not null references businesses(id),
  to_business_id uuid not null references businesses(id),
  member_id uuid references wallet_members(id) on delete set null,
  amount integer not null check (amount > 0),
  reason text not null default 'redemption' check (reason in ('redemption')),
  created_at timestamptz not null default now()
);

create index if not exists ad_credit_transfers_from_idx on ad_credit_transfers (from_business_id, created_at desc);
create index if not exists ad_credit_transfers_to_idx on ad_credit_transfers (to_business_id, created_at desc);
create index if not exists ad_credit_transfers_offer_idx on ad_credit_transfers (offer_id);

alter table ad_credit_transfers enable row level security;

-- Owners can read rows where their shop paid or earned. No insert/update/
-- delete policy: only the security-definer function below writes.
drop policy if exists "ad_credit_transfers: owner can read" on ad_credit_transfers;
create policy "ad_credit_transfers: owner can read" on ad_credit_transfers
  for select to authenticated
  using (
    exists (
      select 1 from businesses b
      where b.owner_id = auth.uid()
        and b.id in (ad_credit_transfers.from_business_id, ad_credit_transfers.to_business_id)
    )
  );

create or replace function public.claim_ad_credit_transaction_membership(p_member_id uuid, p_offer_id uuid, p_redeeming_business_id uuid)
 returns table(credits_transferred integer)
 language plpgsql
 security definer
 set search_path to 'public', 'pg_temp'
as $function$
declare
  v_origin_business_id uuid;
  v_bid integer;
begin
  select c.bid_per_view into v_bid
  from campaigns c
  where c.id = p_offer_id
    and c.creator_type = 'business'
    and c.creator_id = p_redeeming_business_id
  for update;

  if not found then
    raise exception 'Offer not found or not owned by the redeeming business';
  end if;

  select origin_business_id into v_origin_business_id
  from wallet_members
  where id = p_member_id;

  if v_origin_business_id is null then
    return query select 0;
    return;
  end if;

  if v_origin_business_id = p_redeeming_business_id then
    return query select 0;
    return;
  end if;

  update businesses set ad_credits = ad_credits - v_bid
  where id = p_redeeming_business_id and ad_credits >= v_bid;

  if not found then
    raise exception 'Insufficient advertiser credits';
  end if;

  update businesses set ad_credits = ad_credits + v_bid
  where id = v_origin_business_id;

  insert into ad_credit_transfers (offer_id, from_business_id, to_business_id, member_id, amount, reason)
  values (p_offer_id, p_redeeming_business_id, v_origin_business_id, p_member_id, v_bid, 'redemption');

  return query select v_bid;
end;
$function$;
