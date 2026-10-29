-- businesses_due_trial_warning() is SECURITY DEFINER and returns owner ids,
-- names and trial dates, so only the service role (the trials cron) may
-- call it. Idempotent: revoke/grant can be re-run safely.
revoke execute on function businesses_due_trial_warning() from public, anon, authenticated;
grant execute on function businesses_due_trial_warning() to service_role;
