-- ============================================================================
-- Owners can write only their own shop's profile columns directly.
--
-- Found in the security audit: the policy "businesses: owner full access"
-- (FOR ALL, auth.uid() = owner_id) together with Supabase's default table
-- grants lets ANY signed-in owner call the public REST API with the public
-- anon key + their own login and change EVERY column of their own shop row:
-- ad_credits, is_frozen, is_subscription_active, trial_ends_at,
-- stripe_*_id, last_milestone_tier, ... (e.g. give themselves unlimited
-- credits, unfreeze themselves, extend their trial forever). Same on INSERT
-- (a new shop row with any ad_credits).
--
-- The app itself writes businesses through the owner's session in exactly
-- two places, with these columns:
--   /api/onboarding  INSERT owner_id, name, category, latitude, longitude
--   /api/profile     UPDATE name, category, latitude, longitude, phone, whatsapp
-- Everything else (credits, billing, freeze, trial, milestones, logo/cover)
-- is written server-side with the service role, which is unaffected.
--
-- Fix: replace the table-wide INSERT/UPDATE grants with column grants. The
-- RLS policy stays as it is (row = own shop); this limits which columns.
-- anon never needs to write businesses at all.
-- ============================================================================

revoke insert, update on table businesses from anon, authenticated;

grant insert (owner_id, name, category, latitude, longitude) on table businesses to authenticated;
grant update (name, category, latitude, longitude, phone, whatsapp) on table businesses to authenticated;
