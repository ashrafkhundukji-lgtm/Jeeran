-- scans_and_claims only had a SELECT policy for the host business owner
-- (Sprint 2). The Sprint 4 billing ledger needs the campaign *creator* to
-- read their own claims too (to show "credits spent" usage history) —
-- add the missing policy rather than reaching for the admin client again.
create policy "scans: campaign creator can read" on scans_and_claims
  for select using (
    exists (
      select 1 from campaigns c
      where c.id = scans_and_claims.campaign_id
        and (
          (c.creator_type = 'business' and exists (
            select 1 from businesses b where b.id = c.creator_id and b.owner_id = auth.uid()
          ))
          or
          (c.creator_type = 'technician' and exists (
            select 1 from technicians t where t.id = c.creator_id and t.user_id = auth.uid()
          ))
        )
    )
  );
