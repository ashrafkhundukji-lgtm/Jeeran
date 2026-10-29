-- ============================================================================
-- Notification slots over a ROLLING 24 hours, matching Google Wallet's own
-- limit (3 notifications per pass per 24 h), instead of a counter that reset
-- at midnight UTC — which let a burst straddling 03:00 Riyadh exceed what
-- Google accepts.
--
-- notification_slot_claims keeps one row per claimed slot; a claim succeeds
-- only while the member has fewer than p_cap claims in the last 24 h.
-- claim_notification_slot / release_notification_slot keep their signatures,
-- so the window job and Instant Notify are unchanged. The old
-- notifications_sent_date/_count columns are still kept up to date (nothing
-- reads them any more; left for history).
-- ============================================================================

create table if not exists notification_slot_claims (
  id bigint generated always as identity primary key,
  member_id uuid not null references wallet_members(id) on delete cascade,
  claimed_at timestamptz not null default now()
);

create index if not exists notification_slot_claims_member_idx on notification_slot_claims (member_id, claimed_at desc);

comment on table notification_slot_claims is
  'One row per lock-screen notification slot claimed for a member (window ping or Instant Notify). claim_notification_slot() allows at most p_cap rows per member in any rolling 24 h. Service role only.';

alter table notification_slot_claims enable row level security;
-- No policies: service role only.

-- Seed today's already-sent pings so the first rolling window counts them.
-- They're stamped at the member's last batch time when known (else the
-- start of today) — conservative: never earlier than they really were.
insert into notification_slot_claims (member_id, claimed_at)
select m.id, coalesce(m.last_notification_batch_at, date_trunc('day', now()))
from wallet_members m
cross join lateral generate_series(1, m.notifications_sent_count)
where m.notifications_sent_date = current_date
  and m.notifications_sent_count > 0
  and not exists (select 1 from notification_slot_claims c where c.member_id = m.id);

create or replace function claim_notification_slot(p_member_id uuid, p_cap integer)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- Serialise claims per member so two senders can't both take the last slot.
  perform pg_advisory_xact_lock(hashtext('slot:' || p_member_id::text));
  if (select count(*) from notification_slot_claims
      where member_id = p_member_id and claimed_at > now() - interval '24 hours') >= p_cap then
    return false;
  end if;
  insert into notification_slot_claims (member_id) values (p_member_id);
  update wallet_members
    set notifications_sent_count = case when notifications_sent_date = current_date then notifications_sent_count + 1 else 1 end,
        notifications_sent_date = current_date
    where id = p_member_id;
  return true;
end;
$$;

-- Gives back the most recent claim (a send that failed after claiming).
create or replace function release_notification_slot(p_member_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform pg_advisory_xact_lock(hashtext('slot:' || p_member_id::text));
  delete from notification_slot_claims
  where id = (
    select id from notification_slot_claims
    where member_id = p_member_id and claimed_at > now() - interval '24 hours'
    order by claimed_at desc, id desc
    limit 1
  );
  update wallet_members
    set notifications_sent_count = greatest(notifications_sent_count - 1, 0)
    where id = p_member_id and notifications_sent_date = current_date;
end;
$$;

revoke execute on function claim_notification_slot(uuid, integer) from public, anon, authenticated;
revoke execute on function release_notification_slot(uuid) from public, anon, authenticated;
grant execute on function claim_notification_slot(uuid, integer) to service_role;
grant execute on function release_notification_slot(uuid) to service_role;
