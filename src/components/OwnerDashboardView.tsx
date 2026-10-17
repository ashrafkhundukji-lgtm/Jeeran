'use client'

import { useState } from 'react'
import Link from 'next/link'
import OwnerShell, { OwnerTopBar } from '@/components/owner/OwnerShell'
import Sheet from '@/components/owner/Sheet'
import Switch from '@/components/owner/Switch'
import InstallHint from '@/components/owner/InstallHint'
import QrSheetCard, { qrPrintedKey } from '@/components/owner/QrSheetCard'
import { readFlag, subscribeFlags, useClientValue, writeFlag } from '@/components/owner/useClientValue'
import { BTN_CORAL, BTN_SECONDARY, Card, Notice, SectionHeading } from '@/components/owner/ui'
import { formatDay, useCampaigns, type OwnerCampaign } from '@/components/owner/campaigns'
import LevelBadge, { LEVEL_LABELS } from '@/components/LevelBadge'
import MilestoneAnnouncement from '@/components/MilestoneAnnouncement'
import { CategoryCover, PRESS, ShopAvatar } from '@/components/customer/primitives'
import { EmptyState } from '@/components/customer/States'
import {
  AlertIcon,
  ChartIcon,
  CheckIcon,
  ChevronForwardIcon,
  CopyIcon,
  EditIcon,
  EyeIcon,
  InfoIcon,
  PlusIcon,
  TagIcon,
  TrendDownIcon,
  TrendUpIcon,
} from '@/components/customer/icons'
import { useLocale } from '@/lib/i18n/useLocale'
import type { Locale } from '@/lib/i18n/locale'
import { DASHBOARD_COPY } from '@/lib/i18n/dashboard'
import { OWNER_UI_COPY, fill, type OwnerUiCopy } from '@/lib/i18n/ownerUi'
import { WALLET_HOME_COPY } from '@/lib/i18n/walletHome'
import { CATEGORY_LABELS } from '@/lib/categories'
import type { PromotionLevel, PromotionThresholds } from '@/lib/promotion'
import { offerWindowState } from '@/lib/offerWindow'

// Low-balance warning: there is no existing threshold in the codebase
// (SubscriptionBanner only fires at exactly 0), so per the brief it shows
// when the balance covers fewer than this many views of the active offer.
const LOW_BALANCE_VIEWS = 10

type WeekStat = { thisWeek: number; lastWeek: number } | null

export default function OwnerDashboardView({
  businessId,
  businessName,
  businessCategory,
  logoUrl,
  coverUrl,
  isSubscriptionActive,
  adCredits,
  scansHosted,
  customersAcquired,
  scansWeek,
  acquiredWeek,
  campaigns: initialCampaigns,
  redemptionsByCampaign,
  spentByCampaign,
  promotionScore,
  promotionLevel,
  thresholds,
  hasContactDetails,
  unseenMilestoneTier,
  unseenMilestoneBonus,
}: {
  businessId: string
  businessName: string
  businessCategory: string
  logoUrl: string | null
  coverUrl: string | null
  isSubscriptionActive: boolean
  adCredits: number
  scansHosted: number
  customersAcquired: number
  scansWeek: WeekStat
  acquiredWeek: WeekStat
  campaigns: OwnerCampaign[]
  redemptionsByCampaign: Record<string, number>
  spentByCampaign: Record<string, number>
  promotionScore: number
  promotionLevel: PromotionLevel
  thresholds: PromotionThresholds
  hasContactDetails: boolean
  unseenMilestoneTier: string | null
  unseenMilestoneBonus: number | null
}) {
  const [locale] = useLocale()
  const copy = OWNER_UI_COPY[locale]
  const campaignsCopy = DASHBOARD_COPY[locale].campaigns
  const { campaigns, setActive, pendingId, error: toggleError } = useCampaigns(initialCampaigns, campaignsCopy)
  const [tierOpen, setTierOpen] = useState(false)

  const activeCampaign = campaigns.find((c) => c.is_active) ?? null
  const runwayViews = activeCampaign ? Math.floor(adCredits / activeCampaign.bid_per_view) : null

  return (
    <OwnerShell
      tab="home"
      header={
        <OwnerTopBar
          variant="home"
          brand={WALLET_HOME_COPY[locale].brand}
          chip={
            <a
              href="/dashboard/billing"
              className={`flex min-h-11 items-center gap-1.5 rounded-full border border-brand-line bg-white px-3.5 text-[13px] font-semibold text-brand-navy-deep ${PRESS}`}
            >
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-brand-coral-brand" />
              <bdi dir="ltr">{adCredits.toLocaleString('en')}</bdi>
              <span className="text-brand-muted">{copy.balance.label}</span>
            </a>
          }
        />
      }
    >
      <div className="flex flex-col gap-5">
        {unseenMilestoneTier && unseenMilestoneBonus != null && (
          <MilestoneAnnouncement tier={unseenMilestoneTier as PromotionLevel} bonus={unseenMilestoneBonus} />
        )}

        {/* Shop identity */}
        <section className="flex items-center gap-3.5">
          <ShopAvatar name={businessName} logoUrl={logoUrl} size={56} />
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-[22px] leading-tight font-bold text-brand-navy-deep">
              <bdi dir="auto" className="line-clamp-2 break-words">
                {businessName}
              </bdi>
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
              <button
                type="button"
                onClick={() => setTierOpen(true)}
                aria-label={`${LEVEL_LABELS[locale][promotionLevel]} — ${copy.tier.explain}`}
                className={`-my-1.5 inline-flex min-h-11 items-center gap-1 ${PRESS}`}
              >
                <LevelBadge level={promotionLevel} variant="chip" locale={locale} />
                <InfoIcon size={18} className="text-brand-muted" />
              </button>
              <span className="text-sm text-brand-muted">{CATEGORY_LABELS[locale][businessCategory] ?? businessCategory}</span>
            </div>
          </div>
        </section>

        {!isSubscriptionActive && (
          <Notice
            tone="warning"
            icon={<AlertIcon size={20} />}
            action={
              <a href="/dashboard/billing" className="shrink-0 self-center text-sm font-semibold text-brand-coral underline underline-offset-4">
                {DASHBOARD_COPY[locale].subscriptionBanner.manageBilling}
              </a>
            }
          >
            {copy.balance.inactive}
          </Notice>
        )}

        <BalanceCard copy={copy} adCredits={adCredits} activeCampaign={activeCampaign} runwayViews={runwayViews} />

        {/* Headline stats */}
        <section className="grid grid-cols-2 gap-3">
          <StatTile value={scansHosted} label={copy.stats.scansHosted} week={scansWeek} copy={copy} />
          <StatTile value={customersAcquired} label={copy.stats.customersAcquired} week={acquiredWeek} copy={copy} />
        </section>

        <SetupChecklist
          businessId={businessId}
          copy={copy}
          hasLogo={Boolean(logoUrl)}
          hasContactDetails={hasContactDetails}
          hasOffer={campaigns.length > 0}
        />

        {/* Active offer */}
        <section>
          <SectionHeading>{copy.offer.activeHeading}</SectionHeading>
          {toggleError && (
            <Notice tone="warning" icon={<AlertIcon size={20} />} className="mb-3">
              {toggleError}
            </Notice>
          )}
          {activeCampaign ? (
            <Card className="overflow-hidden">
              <CategoryCover
                category={businessCategory}
                imageUrl={activeCampaign.image_url ?? coverUrl}
                iconSize={56}
                decorated
                className="h-[120px]"
              />
              <div className="flex items-start gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-[17px] leading-snug font-bold text-brand-navy-deep">
                    <bdi dir="auto" className="line-clamp-2 break-words">
                      {activeCampaign.title}
                    </bdi>
                  </p>
                  <p className="mt-1 text-sm text-brand-muted">
                    {fill(copy.offer.perView, { n: activeCampaign.bid_per_view })}
                    {' · '}
                    {fill(copy.offer.redemptions, { n: redemptionsByCampaign[activeCampaign.id] ?? 0 })}
                    {' · '}
                    {fill(copy.offer.spent, { n: spentByCampaign[activeCampaign.id] ?? 0 })}
                  </p>
                </div>
                <Switch
                  checked={activeCampaign.is_active}
                  disabled={pendingId === activeCampaign.id}
                  onChange={(next) => setActive(activeCampaign.id, next)}
                  label={fill(copy.offer.toggleLabel, { title: activeCampaign.title })}
                />
              </div>
              <WindowNotice campaign={activeCampaign} copy={copy} locale={locale} />
              <a
                href={`/offers/${activeCampaign.id}`}
                className="flex min-h-12 items-center gap-2 border-t border-brand-line px-4 text-sm font-semibold text-brand-navy active:bg-brand-tint"
              >
                <EyeIcon size={18} />
                <span className="flex-1">{copy.offer.preview}</span>
                <ChevronForwardIcon size={18} />
              </a>
            </Card>
          ) : (
            <EmptyState
              icon={<TagIcon size={30} />}
              title={copy.offer.emptyTitle}
              body={copy.offer.emptyBody}
              action={
                <Link href="/dashboard/owner/campaigns/new" className={`${BTN_CORAL} mt-1`}>
                  <PlusIcon size={20} />
                  {copy.offer.create}
                </Link>
              }
            />
          )}
        </section>

        {/* All offers */}
        {campaigns.length > 0 && (
          <section>
            <SectionHeading
              action={
                <Link href="/dashboard/owner/campaigns/new" className={`inline-flex min-h-11 items-center gap-1 rounded-xl px-2 text-sm font-semibold text-brand-coral ${PRESS}`}>
                  <PlusIcon size={18} />
                  {copy.offer.newCampaign}
                </Link>
              }
            >
              {copy.offer.allHeading}
            </SectionHeading>
            <ul className="flex flex-col gap-3">
              {campaigns.map((c) => (
                <CampaignRow
                  key={c.id}
                  campaign={c}
                  category={businessCategory}
                  redemptions={redemptionsByCampaign[c.id] ?? 0}
                  spent={spentByCampaign[c.id] ?? 0}
                  copy={copy}
                  locale={locale}
                  pending={pendingId === c.id}
                  onToggle={(next) => setActive(c.id, next)}
                />
              ))}
            </ul>
          </section>
        )}

        <QrSheetCard businessId={businessId} businessName={businessName} onPrinted={() => writeFlag(qrPrintedKey(businessId))} />

        <InstallHint />

        <a
          href="/dashboard/owner/leaderboard"
          className={`flex min-h-14 items-center gap-3 rounded-[22px] border border-brand-line bg-white px-4 py-3 ${PRESS}`}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-coral-tint text-brand-coral">
            <ChartIcon size={20} />
          </span>
          <span className="flex-1 text-[15px] font-semibold">{copy.leaderboardRow}</span>
          <ChevronForwardIcon size={20} className="text-brand-muted" />
        </a>
      </div>

      <TierSheet
        open={tierOpen}
        onClose={() => setTierOpen(false)}
        locale={locale}
        copy={copy}
        level={promotionLevel}
        score={promotionScore}
        thresholds={thresholds}
      />
    </OwnerShell>
  )
}

// Active (switched on) but outside its dates: customers don't see it and it
// can't be redeemed — say so on the card instead of implying it's live.
function WindowNotice({ campaign, copy, locale }: { campaign: OwnerCampaign; copy: OwnerUiCopy; locale: Locale }) {
  const state = offerWindowState(campaign.start_date, campaign.end_date)
  if (state === 'live') return null
  const date = formatDay((state === 'ended' ? campaign.end_date : campaign.start_date)!, locale, { day: 'numeric', month: 'long', year: 'numeric' })
  return (
    <div className="px-4 pb-3">
      <Notice tone={state === 'ended' ? 'warning' : 'info'} icon={<AlertIcon size={18} />}>
        {fill(state === 'ended' ? copy.offer.endedNotice : copy.offer.scheduledNotice, { date })}{' '}
        <a href={`/dashboard/owner/campaigns/${campaign.id}`} className="font-semibold underline underline-offset-4">
          {copy.offer.edit}
        </a>
      </Notice>
    </div>
  )
}

function BalanceCard({
  copy,
  adCredits,
  activeCampaign,
  runwayViews,
}: {
  copy: OwnerUiCopy
  adCredits: number
  activeCampaign: OwnerCampaign | null
  runwayViews: number | null
}) {
  const empty = adCredits <= 0
  const low = !empty && runwayViews != null && runwayViews < LOW_BALANCE_VIEWS
  return (
    <section className="bg-brand-hero relative overflow-hidden rounded-[24px] p-5 text-white shadow-brand-hero">
      <div aria-hidden="true" className="bg-brand-dot-grid absolute inset-0 opacity-60" />
      <div className="relative">
        <p className="text-sm font-semibold text-white/80">{copy.balance.label}</p>
        <p className="mt-1 font-display text-[44px] leading-none font-bold">
          <bdi dir="ltr">{adCredits.toLocaleString('en')}</bdi>
        </p>
        <p className="mt-2.5 text-sm leading-relaxed text-white/85">
          {activeCampaign && runwayViews != null
            ? fill(copy.balance.runway, { n: runwayViews.toLocaleString('en'), bid: activeCampaign.bid_per_view })
            : copy.balance.runwayNoOffer}
        </p>
        {(empty || low) && (
          <p role="alert" className="mt-3 flex items-start gap-2 rounded-xl bg-white px-3 py-2.5 text-sm font-semibold text-brand-coral">
            <AlertIcon size={18} className="mt-0.5 shrink-0" />
            {empty ? copy.balance.empty : copy.balance.low}
          </p>
        )}
        <a href="/dashboard/billing" className={`${BTN_CORAL} mt-4 w-full`}>
          <PlusIcon size={20} />
          {copy.balance.topUp}
        </a>
      </div>
    </section>
  )
}

function StatTile({ value, label, week, copy }: { value: number; label: string; week: WeekStat; copy: OwnerUiCopy }) {
  const diff = week ? week.thisWeek - week.lastWeek : 0
  return (
    <Card className="flex flex-col p-4">
      <span className="font-display text-[30px] leading-none font-bold text-brand-navy-deep">
        <bdi dir="ltr">{value.toLocaleString('en')}</bdi>
      </span>
      <span className="mt-1.5 text-sm leading-snug font-semibold text-brand-navy-deep">{label}</span>
      {week && (
        <span className="mt-2 flex flex-col gap-0.5 text-[13px] leading-snug text-brand-muted">
          <span>{fill(copy.stats.thisWeek, { n: week.thisWeek })}</span>
          <span className={`inline-flex items-center gap-1 ${diff > 0 ? 'font-semibold text-brand-navy' : ''}`}>
            {diff > 0 && <TrendUpIcon size={14} className="shrink-0" />}
            {diff < 0 && <TrendDownIcon size={14} className="shrink-0" />}
            {diff === 0 ? copy.stats.same : fill(diff > 0 ? copy.stats.more : copy.stats.less, { n: Math.abs(diff) })}
          </span>
        </span>
      )}
    </Card>
  )
}

function CampaignRow({
  campaign: c,
  category,
  redemptions,
  spent,
  copy,
  locale,
  pending,
  onToggle,
}: {
  campaign: OwnerCampaign
  category: string
  redemptions: number
  spent: number
  copy: OwnerUiCopy
  locale: Locale
  pending: boolean
  onToggle: (next: boolean) => void
}) {
  const dates =
    c.start_date && c.end_date
      ? fill(copy.offer.dates, { start: formatDay(c.start_date, locale), end: formatDay(c.end_date, locale) })
      : c.start_date
        ? fill(copy.offer.from, { start: formatDay(c.start_date, locale) })
        : c.end_date
          ? fill(copy.offer.until, { end: formatDay(c.end_date, locale) })
          : null
  const windowState = offerWindowState(c.start_date, c.end_date)
  return (
    <li>
      <Card className="overflow-hidden">
        <div className="flex items-start gap-3 p-3">
          <a href={`/dashboard/owner/campaigns/${c.id}`} className="flex min-w-0 flex-1 items-start gap-3">
            <CategoryCover category={category} imageUrl={c.image_url} iconSize={28} className="h-16 w-16 flex-none rounded-2xl" />
            <span className="flex min-w-0 flex-1 flex-col gap-1 py-0.5">
              <span className="text-[15px] leading-snug font-bold text-brand-navy-deep">
                <bdi dir="auto" className="line-clamp-2 break-words">
                  {c.title}
                </bdi>
              </span>
              <span className="text-[13px] text-brand-muted">
                {fill(copy.offer.perView, { n: c.bid_per_view })} · {fill(copy.offer.redemptions, { n: redemptions })} ·{' '}
                {fill(copy.offer.spent, { n: spent })}
              </span>
              {dates && <span className="text-[13px] text-brand-muted">{dates}</span>}
            </span>
          </a>
          <div className="flex flex-col items-center gap-0.5">
            <Switch
              checked={c.is_active}
              disabled={pending}
              onChange={onToggle}
              label={fill(copy.offer.toggleLabel, { title: c.title })}
            />
            <span className={`text-xs font-semibold ${!c.is_active ? 'text-brand-muted' : windowState === 'live' ? 'text-brand-navy' : 'text-brand-coral'}`}>
              {!c.is_active
                ? copy.offer.inactive
                : windowState === 'ended'
                  ? copy.offer.ended
                  : windowState === 'scheduled'
                    ? fill(copy.offer.scheduled, { date: formatDay(c.start_date!, locale) })
                    : copy.offer.active}
            </span>
          </div>
        </div>
        <div className="flex border-t border-brand-line">
          <a href={`/dashboard/owner/campaigns/${c.id}`} className="flex min-h-11 flex-1 items-center justify-center gap-1.5 text-sm font-semibold text-brand-navy active:bg-brand-tint">
            <EditIcon size={17} />
            {copy.offer.edit}
          </a>
          <span aria-hidden="true" className="w-px bg-brand-line" />
          <a
            href={`/dashboard/owner/campaigns/new?from=${c.id}`}
            className="flex min-h-11 flex-1 items-center justify-center gap-1.5 text-sm font-semibold text-brand-navy active:bg-brand-tint"
          >
            <CopyIcon size={17} />
            {copy.offer.duplicate}
          </a>
        </div>
      </Card>
    </li>
  )
}

// "Complete your shop" — every item derived from real data except the QR
// one: nothing server-side records that a sheet was printed, so it is
// ticked on this device when the owner downloads or shares the PDF.
function SetupChecklist({
  businessId,
  copy,
  hasLogo,
  hasContactDetails,
  hasOffer,
}: {
  businessId: string
  copy: OwnerUiCopy
  hasLogo: boolean
  hasContactDetails: boolean
  hasOffer: boolean
}) {
  const dismissKey = `jeeran:setup-dismissed:${businessId}`
  // Server snapshot = "dismissed" so nothing flashes before the client
  // reads localStorage.
  const mounted = useClientValue(() => true, false)
  const dismissed = useClientValue(() => readFlag(dismissKey), true, subscribeFlags)
  const qrDone = useClientValue(() => readFlag(qrPrintedKey(businessId)), false, subscribeFlags)

  const items = [
    { done: hasLogo, label: copy.checklist.logo, href: '/dashboard/profile#identity' },
    { done: hasContactDetails, label: copy.checklist.details, href: '/dashboard/profile#contact' },
    { done: hasOffer, label: copy.checklist.offer, href: '/dashboard/owner/campaigns/new' },
    { done: qrDone, label: copy.checklist.qr, href: '#qr-sheet' },
  ]
  const done = items.filter((i) => i.done).length
  if (!mounted || dismissed || done === items.length) return null

  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-[17px] font-semibold">{copy.checklist.title}</h2>
          <p className="text-[13px] text-brand-muted">{fill(copy.checklist.progress, { done, total: items.length })}</p>
        </div>
        <button
          type="button"
          onClick={() => writeFlag(dismissKey)}
          className="min-h-11 rounded-xl px-3 text-sm font-semibold text-brand-muted active:bg-brand-tint"
        >
          {copy.common.dismiss}
        </button>
      </div>
      <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-brand-tint" aria-hidden="true">
        <div className="h-full rounded-full bg-brand-navy" style={{ width: `${(done / items.length) * 100}%` }} />
      </div>
      <ul>
        {items.map((item) => (
          <li key={item.label}>
            <a href={item.href} className="flex min-h-12 items-center gap-3 border-b border-brand-line py-1 last:border-b-0">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                  item.done ? 'bg-brand-navy text-white' : 'border-2 border-brand-tint-2'
                }`}
              >
                {item.done && <CheckIcon size={16} strokeWidth={3} />}
              </span>
              <span className={`flex-1 text-[15px] ${item.done ? 'text-brand-muted line-through' : 'font-semibold'}`}>{item.label}</span>
              {!item.done && <ChevronForwardIcon size={18} className="text-brand-muted" />}
            </a>
          </li>
        ))}
      </ul>
    </Card>
  )
}

// Tier explainer — only what the code actually does: score = redemptions of
// this shop's offers (get_business_promotion_level), thresholds and one-time
// milestone bonuses from promotion_settings, and tier as the tiebreaker
// within a bid bucket in nearby_active_offers().
function TierSheet({
  open,
  onClose,
  locale,
  copy,
  level,
  score,
  thresholds,
}: {
  open: boolean
  onClose: () => void
  locale: Locale
  copy: OwnerUiCopy
  level: PromotionLevel
  score: number
  thresholds: PromotionThresholds
}) {
  const ladder: { level: PromotionLevel; min: number; bonus: number }[] = [
    { level: 'bronze', min: 0, bonus: 0 },
    { level: 'silver', min: thresholds.silverThreshold, bonus: thresholds.silverMilestoneBonus },
    { level: 'gold', min: thresholds.goldThreshold, bonus: thresholds.goldMilestoneBonus },
    { level: 'platinum', min: thresholds.platinumThreshold, bonus: thresholds.platinumMilestoneBonus },
  ]
  const next = ladder.find((t) => t.min > score) ?? null
  const labels = LEVEL_LABELS[locale]

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={copy.tier.sheetTitle}
      footer={
        <button type="button" onClick={onClose} className={`${BTN_SECONDARY} w-full`}>
          {copy.common.close}
        </button>
      }
    >
      <div className="flex flex-col gap-4 text-[15px] leading-relaxed">
        <p>{fill(copy.tier.score, { n: score })}</p>
        {next ? (
          <div className="rounded-2xl bg-brand-tint p-4">
            <p className="font-semibold">{fill(copy.tier.next, { n: next.min - score, tier: labels[next.level] })}</p>
            {next.bonus > 0 && <p className="mt-1 text-sm text-brand-muted">{fill(copy.tier.nextBonus, { n: next.bonus })}</p>}
          </div>
        ) : (
          <p className="rounded-2xl bg-brand-tint p-4 font-semibold">{copy.tier.top}</p>
        )}
        <ol className="overflow-hidden rounded-2xl border border-brand-line">
          {ladder.map((t) => (
            <li
              key={t.level}
              className={`flex min-h-12 items-center gap-3 border-b border-brand-line px-4 last:border-b-0 ${t.level === level ? 'bg-brand-tint' : ''}`}
            >
              <span className="flex-1 font-semibold">{labels[t.level]}</span>
              {t.level === level && <span className="rounded-full bg-brand-navy px-2.5 py-0.5 text-xs font-bold text-white">{copy.tier.current}</span>}
              <span className="text-sm text-brand-muted">{fill(copy.tier.levelRow, { n: t.min })}</span>
            </li>
          ))}
        </ol>
        <p className="text-sm text-brand-muted">{copy.tier.effect}</p>
      </div>
    </Sheet>
  )
}
