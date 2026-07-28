-- ============================================================================
-- Jeeran: signup_ip on wallet_members — fraud-review data only.
--
-- Context: the signup bonus (20260727_wallet_members_last_touch_and_signup_bonus.sql)
-- pays out based on device_id, a plain cookie — clearing cookies or a private
-- window lets the same real person trigger repeat bonuses for a business.
-- Rather than adding identity friction (phone/OTP) to a deliberately
-- frictionless one-scan flow, the containment is a per-business daily cap on
-- bonus payouts (see DAILY_SIGNUP_BONUS_CAP in
-- src/app/api/wallet/membership/create/route.ts). This column captures the
-- requesting IP at signup time so a later manual fraud review has something
-- to correlate repeat-cookie-clearing abuse against. Not read by any code
-- yet and not used to block anything automatically in this pass.
-- ============================================================================

alter table wallet_members
  add column if not exists signup_ip text;
