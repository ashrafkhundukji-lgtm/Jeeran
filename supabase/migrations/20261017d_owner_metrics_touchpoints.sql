-- ============================================================================
-- Owner dashboard numbers: count the current membership flow.
--
-- get_owner_metrics() only counted scans_and_claims, which only the legacy
-- per-offer pass flow writes (2 rows, last one 2026-07-20). Every scan in the
-- current flow — a new member saving the card at a shop, or a returning
-- member rescanning — is a wallet_member_touchpoints row instead, and an
-- offer bringing a customer in is a redemptions row. Legacy rows are still
-- counted so no history disappears.
--
--   scans_hosted       = legacy claims hosted here + touchpoints at this shop
--   customers_acquired = legacy redeemed claims on this shop's campaigns
--                        + distinct members who redeemed an offer here
--
-- get_owner_weekly_metrics() gives the same two numbers for the last 7 days
-- and the 7 before (for "this week vs last week"); a customer counts as
-- acquired in the week of their FIRST redemption at the shop.
-- ============================================================================

create or replace function public.get_owner_metrics(p_business_id uuid)
 returns table(ad_credits integer, scans_hosted bigint, customers_acquired bigint)
 language sql
 stable
 set search_path to 'public', 'pg_temp'
as $function$
  select
    b.ad_credits,
    (select count(*) from scans_and_claims s where s.host_business_id = p_business_id)
      + (select count(*) from wallet_member_touchpoints t where t.business_id = p_business_id),
    (select count(*) from scans_and_claims s
       join campaigns c on c.id = s.campaign_id
       where c.creator_type = 'business' and c.creator_id = p_business_id and s.is_redeemed)
      + (select count(distinct r.member_id) from redemptions r where r.business_id = p_business_id)
  from businesses b
  where b.id = p_business_id;
$function$;

create or replace function public.get_owner_weekly_metrics(p_business_id uuid)
 returns table(scans_this_week bigint, scans_last_week bigint, acquired_this_week bigint, acquired_last_week bigint)
 language sql
 stable
 set search_path to 'public', 'pg_temp'
as $function$
  with w as (
    select now() - interval '7 days' as w1, now() - interval '14 days' as w2
  ),
  scans as (
    select t.scanned_at as at from wallet_member_touchpoints t where t.business_id = p_business_id
    union all
    select s.created_at from scans_and_claims s where s.host_business_id = p_business_id
  ),
  acquired as (
    select min(r.redeemed_at) as at from redemptions r where r.business_id = p_business_id group by r.member_id
    union all
    select s.redeemed_at from scans_and_claims s
      join campaigns c on c.id = s.campaign_id
      where c.creator_type = 'business' and c.creator_id = p_business_id and s.is_redeemed
  )
  select
    (select count(*) from scans, w where scans.at >= w.w1),
    (select count(*) from scans, w where scans.at >= w.w2 and scans.at < w.w1),
    (select count(*) from acquired, w where acquired.at >= w.w1),
    (select count(*) from acquired, w where acquired.at >= w.w2 and acquired.at < w.w1);
$function$;

revoke execute on function public.get_owner_weekly_metrics(uuid) from public, anon, authenticated;
grant execute on function public.get_owner_weekly_metrics(uuid) to service_role;
