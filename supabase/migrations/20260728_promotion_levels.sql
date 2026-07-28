-- ============================================================================
-- Promotion levels: reward shops that actively drive redemptions through
-- Jeeran with a visible level (bronze/silver/gold/platinum), and use that
-- level to give them an edge in ranking — both in the new category browse
-- page and in the wallet geo-push ordering.
--
-- Score = total redemptions earned as an advertiser. redemptions.business_id
-- is the shop whose OWN offer got redeemed (see
-- claim_ad_credit_transaction_membership in 20260719_wallet_members_geo.sql)
-- — the live, current redemption model. The older scans_and_claims /
-- claim_ad_credit_transaction path is the legacy one-off flow (soft-cutover
-- per docs/test-plan.md) and is intentionally not used here.
--
-- Thresholds below are a starting point, not tuned against real data —
-- easy to retune later since they live in one function.
-- ----------------------------------------------------------------------------
create or replace function promotion_level_for_score(p_score bigint)
returns text
language sql
immutable
set search_path = public, pg_temp
as $$
  select case
    when p_score >= 50 then 'platinum'
    when p_score >= 20 then 'gold'
    when p_score >= 5 then 'silver'
    else 'bronze'
  end
$$;

-- Sort-order rank for the level names above — text comparison won't sort
-- bronze/silver/gold/platinum correctly, so ranking queries order by this.
create or replace function promotion_level_rank(p_level text)
returns int
language sql
immutable
set search_path = public, pg_temp
as $$
  select case p_level
    when 'platinum' then 4
    when 'gold' then 3
    when 'silver' then 2
    else 1
  end
$$;

-- One business's current promotion score + level, for the shop's own dashboard.
create or replace function get_business_promotion_level(p_business_id uuid)
returns table (score bigint, level text)
language sql
stable
set search_path = public, pg_temp
as $$
  select
    count(*)::bigint as score,
    promotion_level_for_score(count(*)::bigint) as level
  from redemptions
  where business_id = p_business_id;
$$;

-- Ranked shops within one category, for the consumer-facing browse page.
create or replace function browse_businesses_by_category(p_category text, p_limit int default 50)
returns table (business_id uuid, business_name text, category text, score bigint, level text)
language sql
stable
set search_path = public, pg_temp
as $$
  select
    b.id as business_id,
    b.name as business_name,
    b.category,
    coalesce(r.score, 0)::bigint as score,
    promotion_level_for_score(coalesce(r.score, 0)::bigint) as level
  from businesses b
  left join (
    select business_id, count(*) as score from redemptions group by business_id
  ) r on r.business_id = b.id
  where b.category = p_category
  order by score desc, b.created_at asc
  limit p_limit;
$$;
