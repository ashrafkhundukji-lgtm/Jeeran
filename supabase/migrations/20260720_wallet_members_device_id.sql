-- Anonymous device identifier for the membership save-flow entry point
-- (src/app/api/wallet/membership/create/route.ts). Set as an httpOnly cookie
-- on first visit to a scan-landing page, before any wallet save happens —
-- this is what distinguishes a first-time customer from a returning one
-- BEFORE a pass exists to check against (google_object_id/apple_pass_serial
-- only exist AFTER save).
alter table wallet_members
  add column if not exists device_id text unique;
