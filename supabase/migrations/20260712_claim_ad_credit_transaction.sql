-- Ledger transaction for claiming an ad (Sprint 2).
--
-- Deviates from the PRD's draft in one way on purpose: the draft took
-- p_creator_id / p_creator_type / p_bid_amount as client-supplied
-- parameters, which means any caller of the RPC could pass values that
-- don't match the actual campaign row (e.g. crediting/debiting the wrong
-- party, or an arbitrary bid amount). This version takes only the
-- campaign id and looks up creator_type/creator_id/bid_per_view itself, so
-- the amounts transferred are always the campaign's real values and can't
-- be spoofed by the caller. It also locks the campaign row (FOR UPDATE)
-- for the duration of the transaction to serialize concurrent claims of
-- the same campaign.
create or replace function claim_ad_credit_transaction(
  p_host_business_id uuid,
  p_campaign_id uuid
)
returns table (credits_transferred integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_creator_type text;
  v_creator_id uuid;
  v_bid integer;
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

  insert into scans_and_claims (host_business_id, campaign_id, credits_transferred)
  values (p_host_business_id, p_campaign_id, v_bid);

  return query select v_bid;
end;
$$;

-- Only server-side code using the service role key may invoke this — it
-- moves real credit balances, so it must not be callable by anon/authenticated
-- clients directly via PostgREST RPC. Supabase grants anon/authenticated
-- EXECUTE independently of the PUBLIC pseudo-role, so both must be revoked
-- explicitly (confirmed via the security advisor after the first pass).
revoke execute on function claim_ad_credit_transaction(uuid, uuid) from public;
revoke execute on function claim_ad_credit_transaction(uuid, uuid) from anon;
revoke execute on function claim_ad_credit_transaction(uuid, uuid) from authenticated;
grant execute on function claim_ad_credit_transaction(uuid, uuid) to service_role;

-- get_top_ads (Sprint 1) was flagged by the same advisor pass for a mutable
-- search_path — pin it too.
alter function get_top_ads(uuid, int) set search_path = public, pg_temp;
