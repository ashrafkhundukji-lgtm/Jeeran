-- ============================================================================
-- Phase 4, item 9: one-time milestone bonus when a business crosses into a
-- new promotion tier, plus a real dashboard announcement (not a silent
-- balance change).
--
-- Tier is computed dynamically from score (promotion_level_for_score()), not
-- stored, so "crossing a threshold" is detected at the moment score changes
-- - i.e. wherever a redemption affects it - not polled separately. The only
-- place redemptions.business_id score-driving rows get inserted today is
-- /api/redeem's successful-redemption path (confirmed: the legacy
-- scans_and_claims flow deliberately doesn't feed promotion score at all,
-- per 20260728_promotion_levels.sql's own comment).
-- ============================================================================

-- Per-tier milestone bonus amounts — same admin-editable table Phase 3
-- already built thresholds into, reusing /api/admin/settings and
-- /admin/settings rather than a second config surface.
alter table promotion_settings
  add column if not exists silver_milestone_bonus numeric not null default 10,
  add column if not exists gold_milestone_bonus numeric not null default 25,
  add column if not exists platinum_milestone_bonus numeric not null default 100;

-- last_milestone_tier: the highest tier this business has ever been AWARDED
-- a milestone bonus for — the idempotency guard, same role
-- wallet_members.signup_bonus_paid plays for the signup bonus. Null means
-- "never crossed" (bronze is the floor everyone starts at and was never
-- "crossed into", so it never gets a bonus or fills this column).
--
-- unseen_milestone_tier / unseen_milestone_bonus: set together with
-- last_milestone_tier at the moment of a crossing, cleared together when
-- the owner dismisses the dashboard announcement (see
-- /api/dashboard/dismiss-milestone). Storing the bonus amount alongside
-- the tier (rather than re-deriving it from promotion_settings at display
-- time) means the announcement always shows what was ACTUALLY paid, even
-- if an admin changes the bonus amounts before the owner's next dashboard
-- load.
alter table businesses
  add column if not exists last_milestone_tier text,
  add column if not exists unseen_milestone_tier text,
  add column if not exists unseen_milestone_bonus numeric;

-- check_and_award_milestone_bonus: recomputes the business's current score
-- and tier, and if it's genuinely higher than last_milestone_tier, pays the
-- bonus for the NEWLY REACHED tier only (a business that jumps two tiers in
-- one batch of redemptions — e.g. bronze straight to gold — gets gold's
-- bonus, not silver's-then-gold's; "the newly computed tier" is singular by
-- design, not a backfill of every tier passed through).
--
-- Race-safety: `for update` locks the business row for the duration of the
-- check, so two concurrent redemptions that would otherwise both observe
-- "not yet crossed" and both pay out can't - matches the FOR UPDATE pattern
-- claim_ad_credit_transaction_membership already uses on the campaigns row.
create or replace function check_and_award_milestone_bonus(p_business_id uuid)
returns table (crossed boolean, new_tier text, bonus_awarded numeric)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_old_tier text;
  v_score bigint;
  v_new_tier text;
  v_bonus numeric;
begin
  select last_milestone_tier into v_old_tier from businesses where id = p_business_id for update;

  select count(*) into v_score from redemptions where business_id = p_business_id;
  v_new_tier := promotion_level_for_score(v_score);

  if promotion_level_rank(v_new_tier) <= promotion_level_rank(coalesce(v_old_tier, 'bronze')) then
    return query select false, v_new_tier, null::numeric;
    return;
  end if;

  select case v_new_tier
    when 'silver' then silver_milestone_bonus
    when 'gold' then gold_milestone_bonus
    when 'platinum' then platinum_milestone_bonus
    else 0
  end into v_bonus
  from promotion_settings limit 1;

  update businesses
  set ad_credits = ad_credits + v_bonus,
      last_milestone_tier = v_new_tier,
      unseen_milestone_tier = v_new_tier,
      unseen_milestone_bonus = v_bonus
  where id = p_business_id;

  return query select true, v_new_tier, v_bonus;
end;
$$;

revoke execute on function check_and_award_milestone_bonus(uuid) from public;
revoke execute on function check_and_award_milestone_bonus(uuid) from anon;
revoke execute on function check_and_award_milestone_bonus(uuid) from authenticated;
grant execute on function check_and_award_milestone_bonus(uuid) to service_role;
