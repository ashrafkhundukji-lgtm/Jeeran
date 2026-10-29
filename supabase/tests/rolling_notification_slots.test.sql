-- Test for claim_notification_slot / release_notification_slot over a
-- rolling 24 h (supabase/migrations/20261031c_rolling_notification_slots.sql).
-- Uses one throwaway ZZTEST member and deletes it at the end (its claims go
-- with it, on delete cascade). Any failed check raises and aborts.
do $$
declare
  m uuid;
  ok boolean;
begin
  insert into wallet_members (device_id, home_lat, home_lng) values ('ZZTEST-slot-test', 24.7, 46.7) returning id into m;

  -- 3 slots, then refused
  for i in 1..3 loop
    if not claim_notification_slot(m, 3) then raise exception 'claim % should succeed', i; end if;
  end loop;
  if claim_notification_slot(m, 3) then raise exception '4th claim within 24 h must be refused'; end if;

  -- a failed send gives its slot back
  perform release_notification_slot(m);
  if not claim_notification_slot(m, 3) then raise exception 'claim after release should succeed'; end if;

  -- 3 sends 2 h ago (e.g. just before 03:00 Riyadh): still counted after
  -- midnight UTC — the old per-date counter would have reset here
  update notification_slot_claims set claimed_at = now() - interval '2 hours' where member_id = m;
  if claim_notification_slot(m, 3) then raise exception 'sends 2 h ago must still count'; end if;

  -- 23 h 59 m ago: still inside the window
  update notification_slot_claims set claimed_at = now() - interval '23 hours 59 minutes' where member_id = m;
  if claim_notification_slot(m, 3) then raise exception 'sends 23h59m ago must still count'; end if;

  -- 24 h 1 m ago: outside the window, slots free again
  update notification_slot_claims set claimed_at = now() - interval '24 hours 1 minute' where member_id = m;
  if not claim_notification_slot(m, 3) then raise exception 'sends older than 24 h must not count'; end if;

  -- cap 0 = paused
  if claim_notification_slot(m, 0) then raise exception 'cap 0 must refuse'; end if;

  delete from wallet_members where id = m;
  raise notice 'rolling_notification_slots: all checks passed';
end;
$$;
