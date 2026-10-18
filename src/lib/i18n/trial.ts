// Length of the free trial as claimed in marketing copy (landing page and
// signup, all three languages). The single place to change it: every
// "first N months free" string is built from this number.
//
// Keep it in step with the real trial, which the database sets
// (businesses.trial_ends_at default, supabase/migrations/
// 20260714_trial_period.sql: now() + interval '3 months').
//
// Arabic and Urdu wording here assumes a plural count (3–10 in Arabic);
// if this changes to 1, 2 or 11+, check the Arabic phrasing in
// landing.ts / auth.ts reads naturally.
export const FREE_TRIAL_MONTHS = 3
