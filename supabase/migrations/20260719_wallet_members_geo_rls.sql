-- Follow-up to 20260719_wallet_members_geo.sql: the security advisor flagged
-- wallet_members, redemptions, and offer_notifications as public tables with
-- RLS disabled — meaning anon/authenticated clients could read/write them
-- directly via PostgREST, bypassing the API routes entirely. All actual
-- access to these tables goes through supabaseAdmin (service_role, which
-- bypasses RLS), so enabling RLS with the policies below only closes the
-- direct-REST-access gap; the app's own read/write paths are unaffected.

alter table wallet_members enable row level security;
-- No policies: wallet_members carries a signable member-identity token and
-- home location, and nothing in the app reads/writes it as anon/authenticated
-- today (registration, geo-notify, and redemption all go through
-- supabaseAdmin). Deny-by-default until a client-facing use case needs it.

alter table redemptions enable row level security;
-- Mirrors "scans: host business owner can read" on scans_and_claims — the
-- business that hosted the redemption can see its own redemption history.
create policy "redemptions: business owner can read" on redemptions
  for select using (
    exists (select 1 from businesses b where b.id = redemptions.business_id and b.owner_id = auth.uid())
  );

alter table offer_notifications enable row level security;
create policy "offer_notifications: business owner can read" on offer_notifications
  for select using (
    exists (select 1 from businesses b where b.id = offer_notifications.business_id and b.owner_id = auth.uid())
  );
