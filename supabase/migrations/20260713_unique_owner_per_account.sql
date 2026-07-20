-- Every dashboard page assumes one business per owner and one technician
-- profile per user (`.maybeSingle()` lookups keyed on owner_id/user_id
-- throughout Sprint 3), but nothing enforced that. A duplicate row makes
-- `.maybeSingle()` throw PGRST116 ("multiple rows returned"), which if the
-- caller doesn't check the error, gets misread as "no business found" and
-- silently routes an already-onboarded owner back through onboarding.
alter table businesses add constraint businesses_owner_id_key unique (owner_id);
alter table technicians add constraint technicians_user_id_key unique (user_id);
