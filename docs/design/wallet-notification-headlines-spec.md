# Wallet notifications: headline model (spec for approval)

Status: agreed 2026-10-29; built on `feature/notification-headlines`. Two rules were tightened after simulation (marked *changed*).

## Problem
- Lock-screen pings go out once a day at 06:00 Riyadh (`0 3 * * *` UTC), up to 3 in one burst, one offer per ping.
- The pinged offers follow card ranking (bid-led), so the same top bidders win every day; a new or low-bid shop rarely reaches the lock screen.
- On days with nothing new, the current top offer is re-sent ("Don't miss nearby deals"), which trains customers to ignore pings.
- A shop that posts an offer or joins sees no customer reaction until the next morning.

Card content is NOT part of the problem: it already refreshes silently within seconds of any change and keeps its current bid-led ranking.

## Principle
Every offer in the pool belongs to a subscribed shop paying per redemption (bid 2–10). The question is not "news vs paid" but how to weigh freshness against bid. What we sell is the **headline**: the one shop name a customer reads on the lock screen.

## The ping
One headline shop plus up to two named others:

> **Al-Hara Bakery: 20% off all pastries**
> Also near you: Corner Café, Noor Laundry

Opening it shows the card (unchanged). Text stays localised (ar/en/ur) as today.

## Who gets the headline (per customer, per send window)
Candidates = active offers in the customer's radius (same eligibility as `nearby_active_offers()`).

1. **New-shop introduction (guaranteed).** A shop whose first offer went live in the last 7 days is introduced once to each nearby customer ("A new shop joined your neighbourhood"). Never repeated for that customer.
2. **Bid-weighted draw.** Otherwise pick at random with weight = `bid × freshness × relevance`:
   - `bid`: the offer's `bid_per_view` (2–10). Bid buys share of headlines, not the top spot every time.
   - `freshness`: ×3 for 48 h after an offer is created or its content changes; ×1 after.
   - `relevance`: mild distance factor (closer = higher); category affinity later, once we have engagement data.
3. **Repeat limit.** A shop cannot be a customer's headline more than once in 7 days, unless it has posted a new or changed offer since — and even then not within 2 days (*changed*: otherwise editing the offer every day would buy a daily headline).
4. **"Also near you" names:** the next two by bid, excluding the headline shop.
5. **Instant Notify add-on:** unchanged. Sends immediately and uses the same daily slot ledger; the send counts as that shop's headline for the repeat limit.

If no candidate passes the rules, the customer gets no ping in that window. A quiet area simply pings less.

## When pings go out
- Two windows a day, about **12:30** and **19:30** Riyadh (to confirm).
- At most **1 ping per customer per day**, or **2** when the second is a new-shop introduction (*changed*: originally also for a boosted new offer, but in a busy area some shop has always just edited its offer, so that meant 2 pings every day; simulated 14 a week instead of 7). Fresh offers still get their ×3 boost in the normal daily ping; Instant Notify is the same-day option.
- Google's hard cap (3 per pass per rolling 24 h) is respected through the existing `claim_notification_slot()` ledger; one slot is always left for Instant Notify.
- Quiet days still get a bid-weighted pick (agreed), limited by the 7-day repeat rule.
- The daily "same top offer" reminder (`notifyReminder`) is removed.

### Scheduling (agreed: Supabase pg_cron, free)
Vercel Hobby cron can only fire once a day, so two pg_cron jobs call `GET /api/cron/wallet-notify` at 09:30 and 16:30 UTC (12:30 and 19:30 Riyadh, no DST). The endpoint answers 202 at once and does the work in the background (up to 300 s). `?dryRun=1` returns the summary instead and sends nothing.

One-time setup, done by the owner in the Supabase dashboard (it changes Supabase settings):
1. Database → Extensions: enable **pg_cron** and **pg_net**.
2. SQL editor, replacing `<CRON_SECRET>` with the same value as Vercel's `CRON_SECRET` (stored in Vault, never in the job text):

```sql
select vault.create_secret('<CRON_SECRET>', 'jeeran_cron_secret');

select cron.schedule('wallet-notify-midday', '30 9 * * *', $$
  select net.http_get(
    url := 'https://jeeran.vercel.app/api/cron/wallet-notify?window=midday',
    headers := jsonb_build_object('Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'jeeran_cron_secret')),
    timeout_milliseconds := 30000
  );
$$);

select cron.schedule('wallet-notify-evening', '30 16 * * *', $$
  select net.http_get(
    url := 'https://jeeran.vercel.app/api/cron/wallet-notify?window=evening',
    headers := jsonb_build_object('Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'jeeran_cron_secret')),
    timeout_milliseconds := 30000
  );
$$);
```

Change a time later with `select cron.alter_job((select jobid from cron.job where jobname = 'wallet-notify-evening'), schedule := '0 17 * * *');`. Pause everything with `promotion_settings.max_daily_wallet_notifications = 0`. Check runs in `cron.job_run_details` and `net._http_response`.

The once-a-day card sweep (`/api/cron/wallet-refresh`) stays on Vercel cron; it no longer sends pings.

## Data changes (migration)
- `notification_headlines`: `member_id`, `business_id`, `offer_id`, `offer_updated_at`, `kind` (`intro` | `draw` | `instant`), `sent_at`. Drives the repeat limit, the one-time intro and the shop metrics below. Indexed on `(member_id, business_id, sent_at)`.
- `notification_mentions` (or a `mentioned_business_ids uuid[]` column on the row above) for "also near you" counts.
- `promotion_settings` gains the tunable knobs listed below.
- The existing `notified_offer_versions` and `notifications_sent_*` stay; the new table supersedes the version map for ping decisions.

## Settings (admin-tunable, no code change)
| Setting | Default |
|---|---|
| Freshness boost / duration | `notify_boost_factor` ×3 / `notify_boost_hours` 48 h |
| Repeat limit per shop per customer | `notify_repeat_days` 7 days (minimum 2 days after an edit, fixed) |
| New-shop window | `notify_new_shop_days` 7 days |
| Pings per customer per day | `notify_daily_base` 1, `notify_daily_with_news` 2 (second only for a new-shop intro) |
| Send windows (Riyadh) | 12:30, 19:30 — the pg_cron schedules, not a table column |
| Pause all pings | existing `max_daily_wallet_notifications = 0` |

## Shop-facing value
- Owner dashboard: "Headline for **412** nearby customers this week · mentioned **1,030** times · **23** redeemed."
- When posting an offer: "Nearby customers will hear about it from 19:30 today."

## Measurement
- Offer links on the card already carry the signed member token (`/offers/[id]?token=…`). Log those opens to see whether pings lead to taps, per kind (intro / draw / instant).
- Later phase (not in this build): slow down pings for customers who never open or redeem.

## Not changing
Card content and ranking, `nearby_active_offers()`, redemption logic, billing, the member token, and `merchantLocations`.

## Test plan
- Unit tests for the draw: shares converge to bid ratios over many draws; the repeat limit, intro-once and boost expiry all hold.
- Dry-run mode on production data: compute who would get what headline per window and log it, without sending. Review the distribution per area before turning it on.
- ZZTEST members only for real sends, then cleanup with proof.

## Rollout order
1. Apply migration `20261029_notification_headlines.sql` (additive: new column, table, functions, settings).
2. Dry run against production data: `GET /api/cron/wallet-notify?dryRun=1`; review the per-shop spread.
3. Merge and deploy. From this point the 06:00 send stops.
4. Owner enables pg_cron + pg_net and runs the scheduling SQL above. Pings resume at the next window.

Steps 3 and 4 should happen the same day, or customers get no pings in between.
