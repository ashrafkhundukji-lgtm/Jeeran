-- ============================================================================
-- "Most active shops" leaderboard (Phase 4, item 10) — genuine new-customer
-- acquisition only, not rescans. wallet_members.origin_business_id is
-- permanent and set exactly once, at member creation (see
-- 20260818b_rescan_credit_dual_award.sql's reversal of last-touch), so
-- counting wallet_members rows by origin_business_id + created_at is
-- already precisely "first-time wallet downloads at that business" — no
-- separate flag needed, and rescans never appear here since a rescan never
-- creates a new wallet_members row.
--
-- Purely informational: this function has no bearing on nearby_active_offers,
-- browse_businesses_by_category, or promotion_level_for_score — it's a
-- separate read, not fed into ranking anywhere.
-- ============================================================================

create or replace function top_shops_by_new_customers(p_since timestamptz, p_limit int default 10)
returns table (business_id uuid, business_name text, new_customers bigint)
language sql
stable
set search_path = public, pg_temp
as $$
  select
    b.id as business_id,
    b.name as business_name,
    count(m.id) as new_customers
  from wallet_members m
  join businesses b on b.id = m.origin_business_id
  where m.created_at >= p_since
  group by b.id, b.name
  order by new_customers desc, b.name asc
  limit p_limit;
$$;
