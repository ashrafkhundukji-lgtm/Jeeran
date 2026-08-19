-- ============================================================================
-- Split "card update" from "notification ping".
--
-- Until now, refreshMember() (geo-notify.ts) did both in the same pass: patch
-- the card immediately AND fire an actual lock-screen push (addMessage,
-- messageType: TEXT_AND_NOTIFY) for whichever offer was newly-appeared. At
-- real scale (many shops, many daily offer changes) that's dozens-to-hundreds
-- of pings a day per customer — an uninstall risk. The card-refresh part is
-- silent and cheap either way and stays immediate; the actual notification
-- moves to a once-daily batched job (wired into the existing wallet-refresh
-- cron — see src/app/api/cron/wallet-refresh/route.ts), capped per run.
--
-- Two new, independent tracking fields on wallet_members — deliberately NOT
-- reusing last_notified_offers/last_notified_at, which stay exactly as they
-- are today (they track "offer versions currently reflected on the card",
-- i.e. the immediate diff-based refresh trigger, unrelated to pushes going
-- forward):
--   notified_offer_versions   — {offer_id: offer's updated_at at the last
--                                 time THAT offer actually consumed a
--                                 notification slot}. Same {offer_id:
--                                 updated_at} version-comparison technique
--                                 last_notified_offers already established
--                                 (20260817b_offer_content_versioning.sql),
--                                 just a second, independent instance of it
--                                 scoped to pushes instead of card content —
--                                 an offer that hasn't changed since it last
--                                 consumed a slot shouldn't re-consume one on
--                                 a later day.
--   last_notification_batch_at — when this member's slice of the daily
--                                 batch last ran (diagnostics/observability
--                                 only, mirrors last_notified_at's role).
-- ============================================================================

alter table wallet_members
  add column if not exists notified_offer_versions jsonb not null default '{}'::jsonb,
  add column if not exists last_notification_batch_at timestamptz;

comment on column wallet_members.notified_offer_versions is
  'Offer-version map ({offer_id: offer_updated_at}) of offers that have already consumed a lock-screen notification slot for this member — populated by the daily notification batch (src/lib/wallet/geo-notify.ts sendDailyNotificationBatch), independent of last_notified_offers (which tracks card content, refreshed immediately/silently and unrelated to pushes).';

-- The cap is Google Wallet's own hard platform limit (3 addMessage
-- calls/genericObject/24h — QuotaExceededException past that, already
-- discovered and documented in google-membership-pass.ts's notifyNewOffer
-- doc comment) — not an arbitrary product choice, though the product intent
-- is to dial it down to 1 later without a code change, hence a config
-- column rather than a literal in the batch job. promotion_settings is
-- already the shared admin-configurable settings singleton (bid_tiebreak_range,
-- tier thresholds), so this lives alongside those rather than a new table.
-- Constrained to [0, 3]: 0 lets an admin fully pause pushes without touching
-- code; anything above 3 would just get silently throttled by Google
-- regardless of what we ask for, so a higher value here would be misleading.
alter table promotion_settings
  add column if not exists max_daily_wallet_notifications int not null default 3
    check (max_daily_wallet_notifications between 0 and 3);
