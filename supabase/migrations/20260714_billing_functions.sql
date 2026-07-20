-- record_billing_event: idempotent ledger write + atomic credit/subscription
-- update. Dedupes on stripe_event_id so a Stripe webhook retry (Stripe
-- delivers "at least once") can't double-credit an account — the insert's
-- ON CONFLICT DO NOTHING means the update only ever runs for a genuinely
-- new event.
create or replace function record_billing_event(
  p_account_type text,
  p_account_id uuid,
  p_type text,
  p_stripe_event_id text,
  p_amount_usd numeric,
  p_credits_granted integer
)
returns table (already_processed boolean)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_inserted_id uuid;
begin
  insert into billing_transactions (account_type, account_id, type, stripe_event_id, amount_usd, credits_granted)
  values (p_account_type, p_account_id, p_type, p_stripe_event_id, p_amount_usd, p_credits_granted)
  on conflict (stripe_event_id) do nothing
  returning id into v_inserted_id;

  if v_inserted_id is null then
    return query select true;
    return;
  end if;

  if p_account_type = 'business' then
    update businesses
      set ad_credits = ad_credits + p_credits_granted,
          is_subscription_active = case
            when p_type in ('subscription_initial', 'subscription_renewal') then true
            else is_subscription_active
          end
      where id = p_account_id;
  else
    update technicians
      set ad_credits = ad_credits + p_credits_granted,
          is_subscription_active = case
            when p_type in ('subscription_initial', 'subscription_renewal') then true
            else is_subscription_active
          end
      where id = p_account_id;
  end if;

  return query select false;
end;
$$;

revoke execute on function record_billing_event(text, uuid, text, text, numeric, integer) from public;
revoke execute on function record_billing_event(text, uuid, text, text, numeric, integer) from anon;
revoke execute on function record_billing_event(text, uuid, text, text, numeric, integer) from authenticated;
grant execute on function record_billing_event(text, uuid, text, text, numeric, integer) to service_role;

-- set_subscription_status: used on customer.subscription.deleted. Looks up
-- by stripe_subscription_id across both tables rather than taking an
-- account_type param — a subscription id can only ever match one of them.
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
end;
$$;

revoke execute on function set_subscription_status(text, boolean) from public;
revoke execute on function set_subscription_status(text, boolean) from anon;
revoke execute on function set_subscription_status(text, boolean) from authenticated;
grant execute on function set_subscription_status(text, boolean) to service_role;

-- get_top_ads: add the Sprint 4 subscription gate on top of Sprint 1's
-- exclusion/credit-check logic. An inactive subscriber's campaigns are now
-- excluded from matchmaking entirely, regardless of credit balance.
create or replace function get_top_ads(p_host_business_id uuid, p_limit int default 3)
returns table (
  campaign_id uuid,
  title text,
  description text,
  bid_per_view integer,
  creator_type text,
  creator_id uuid
)
language sql
stable
set search_path = public, pg_temp
as $$
  with host as (
    select id, category from businesses where id = p_host_business_id
  ),
  eligible as (
    select
      c.id as campaign_id,
      c.title,
      c.description,
      c.bid_per_view,
      c.creator_type,
      c.creator_id,
      case
        when c.creator_type = 'business' then (select b.ad_credits from businesses b where b.id = c.creator_id)
        when c.creator_type = 'technician' then (select t.ad_credits from technicians t where t.id = c.creator_id)
      end as creator_credits,
      case
        when c.creator_type = 'business' then (select b.is_subscription_active from businesses b where b.id = c.creator_id)
        when c.creator_type = 'technician' then (select t.is_subscription_active from technicians t where t.id = c.creator_id)
      end as creator_subscription_active
    from campaigns c, host
    where c.is_active
      and not (c.creator_type = 'business' and c.creator_id = host.id)
      and not (c.creator_type = 'business' and c.creator_id in (
        select b2.id from businesses b2 where b2.category = host.category and b2.id <> host.id
      ))
      and not (c.creator_type = 'technician' and c.creator_id in (
        select t2.id from technicians t2 where t2.linked_business_id = host.id
      ))
  )
  select campaign_id, title, description, bid_per_view, creator_type, creator_id
  from eligible
  where creator_credits is not null and creator_credits > bid_per_view
    and creator_subscription_active is true
  order by
    bid_per_view desc,
    md5(campaign_id::text || floor(extract(epoch from now()) / 300)::text)
  limit p_limit;
$$;
