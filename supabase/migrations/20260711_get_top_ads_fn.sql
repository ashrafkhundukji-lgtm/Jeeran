-- Matchmaking engine: top-N ads to show a customer scanning host_business_id.
--
-- Exclusion: drop the host's own ads, ads from other businesses in the same
-- category (direct competitors), and ads from technicians linked to the host
-- business itself.
-- Credit check: creator's current ad_credits must exceed the campaign's
-- bid_per_view (they need to be able to afford the transfer this claim
-- would trigger).
-- Ranking: highest bid_per_view first; ties are broken by a hash that
-- rotates every 5 minutes (md5 of campaign id + time bucket) so that among
-- equal bids, exposure rotates fairly over time instead of always favoring
-- the same campaign (e.g. oldest by created_at or lowest by id).
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
      end as creator_credits
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
  order by
    bid_per_view desc,
    md5(campaign_id::text || floor(extract(epoch from now()) / 300)::text)
  limit p_limit;
$$;
