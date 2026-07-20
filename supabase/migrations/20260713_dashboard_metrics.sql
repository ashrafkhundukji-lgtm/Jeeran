-- Dashboard metrics (Sprint 3).
create or replace function get_owner_metrics(p_business_id uuid)
returns table (ad_credits integer, scans_hosted bigint, customers_acquired bigint)
language sql
stable
set search_path = public, pg_temp
as $$
  select
    b.ad_credits,
    (select count(*) from scans_and_claims s where s.host_business_id = p_business_id),
    (select count(*) from scans_and_claims s
       join campaigns c on c.id = s.campaign_id
       where c.creator_type = 'business' and c.creator_id = p_business_id and s.is_redeemed)
  from businesses b
  where b.id = p_business_id;
$$;

create or replace function get_technician_metrics(p_technician_id uuid)
returns table (ad_credits integer, leads_generated bigint)
language sql
stable
set search_path = public, pg_temp
as $$
  select
    t.ad_credits,
    (select count(*) from scans_and_claims s
       join campaigns c on c.id = s.campaign_id
       where c.creator_type = 'technician' and c.creator_id = p_technician_id and s.is_redeemed)
  from technicians t
  where t.id = p_technician_id;
$$;
