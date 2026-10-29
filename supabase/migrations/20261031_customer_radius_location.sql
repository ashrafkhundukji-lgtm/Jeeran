-- ============================================================================
-- Customer-controlled offer radius and location.
--
-- 1. New members start at 3 km instead of 1 km (column default only —
--    existing rows keep their current push_radius_km; nothing is backfilled).
--    The allowed values (1 / 3 / 5 / 10) are enforced by the API route
--    (src/app/api/wallet/membership/preferences/route.ts), not a CHECK, so
--    the shop-side reach add-on and any future value aren't constrained here.
-- 2. wallet_member_pref_changes + claim_member_pref_change(): a per-member
--    rate limit for that route (one row per accepted change), so a leaked
--    member link can't be used to hammer the Wallet API with card refreshes.
--
-- Additive only.
-- ============================================================================

-- ── 1. Default radius for new members ──
alter table wallet_members alter column push_radius_km set default 3;

-- ── 2. Rate limit for preference changes ──
create table if not exists wallet_member_pref_changes (
  id bigint generated always as identity primary key,
  member_id uuid not null references wallet_members(id) on delete cascade,
  kind text not null check (kind in ('radius', 'location', 'both')),
  changed_at timestamptz not null default now()
);

create index if not exists wallet_member_pref_changes_member_idx on wallet_member_pref_changes (member_id, changed_at desc);

comment on table wallet_member_pref_changes is
  'One row per accepted customer change of offer radius and/or location (/api/wallet/membership/preferences). Used for its per-member rate limit (claim_member_pref_change). Service role only.';

alter table wallet_member_pref_changes enable row level security;
-- No policies: written and read only by the service role.

-- Records a change and returns true, or returns false when the member has
-- already made p_max changes in the last p_window_minutes. The advisory lock
-- serialises concurrent calls for the same member so two requests can't both
-- squeeze under the limit.
create or replace function claim_member_pref_change(p_member_id uuid, p_kind text, p_max int, p_window_minutes int)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform pg_advisory_xact_lock(hashtext('pref:' || p_member_id::text));
  if (select count(*) from wallet_member_pref_changes
      where member_id = p_member_id
        and changed_at > now() - make_interval(mins => p_window_minutes)) >= p_max then
    return false;
  end if;
  insert into wallet_member_pref_changes (member_id, kind) values (p_member_id, p_kind);
  return true;
end;
$$;

revoke execute on function claim_member_pref_change(uuid, text, int, int) from public, anon, authenticated;
grant execute on function claim_member_pref_change(uuid, text, int, int) to service_role;
