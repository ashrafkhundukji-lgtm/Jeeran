'use client'

import { useState } from 'react'
import DashboardNav from '@/components/DashboardNav'
import OwnerAppBar from '@/components/OwnerAppBar'
import CampaignManager, { campaignErrorCopyFor } from '@/components/CampaignManager'
import SubscriptionBanner from '@/components/SubscriptionBanner'
import LevelBadge from '@/components/LevelBadge'
import MilestoneAnnouncement from '@/components/MilestoneAnnouncement'
import { useLocale } from '@/lib/i18n/useLocale'
import { getDir } from '@/lib/i18n/locale'
import { DASHBOARD_COPY } from '@/lib/i18n/dashboard'
import { CATEGORY_LABELS } from '@/lib/categories'
import type { PromotionLevel } from '@/lib/promotion'

interface Campaign {
  id: string
  title: string
  description: string | null
  bid_per_view: number
  is_active: boolean
  start_date: string | null
  end_date: string | null
  image_url: string | null
  title_ar: string | null
  title_en: string | null
  title_ur: string | null
  description_ar: string | null
  description_en: string | null
  description_ur: string | null
}

export default function OwnerDashboardView({
  businessId,
  businessName,
  businessCategory,
  isSubscriptionActive,
  adCredits,
  scansHosted,
  customersAcquired,
  campaigns,
  promotionScore,
  promotionLevel,
  unseenMilestoneTier,
  unseenMilestoneBonus,
}: {
  businessId: string
  businessName: string
  businessCategory: string
  isSubscriptionActive: boolean
  adCredits: number
  scansHosted: number
  customersAcquired: number
  campaigns: Campaign[]
  promotionScore: number
  promotionLevel: PromotionLevel
  unseenMilestoneTier: string | null
  unseenMilestoneBonus: number | null
}) {
  const [locale] = useLocale()
  const dir = getDir(locale)
  const copy = DASHBOARD_COPY[locale].owner
  const campaignsCopy = DASHBOARD_COPY[locale].campaigns
  const leaderboardCopy = DASHBOARD_COPY[locale].leaderboard

  // Mirrors `campaigns` locally so the active-offer card's toggle can update
  // optimistically. CampaignManager below keeps its own independent copy of
  // the same initial list for its full create/edit flow — see this
  // component's own note in the redesign plan on why that's an accepted,
  // small duplication rather than lifted shared state: campaigns are capped
  // at one active at a time, and the two surfaces are rarely both being
  // edited in the same visit. A page refresh reconciles the rare case where
  // they'd drift.
  const [localCampaigns, setLocalCampaigns] = useState<Campaign[]>(campaigns)
  const [toggleError, setToggleError] = useState('')
  const [showCampaignForm, setShowCampaignForm] = useState(false)

  const activeCampaign = localCampaigns.find((c) => c.is_active) ?? null
  const runwayViews = activeCampaign ? Math.floor(adCredits / activeCampaign.bid_per_view) : null

  async function handleToggleActive(id: string, current: boolean) {
    setToggleError('')
    setLocalCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, is_active: !current } : c)))

    const res = await fetch(`/api/campaigns/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !current }),
    })
    if (!res.ok) {
      setLocalCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, is_active: current } : c)))
      const body = await res.json().catch(() => ({}))
      setToggleError(campaignErrorCopyFor(body.error ?? '', campaignsCopy, campaignsCopy.toggleError))
    }
  }

  function openCampaignForm() {
    setShowCampaignForm(true)
    document.getElementById('campaign-manager')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <main dir={dir} className="min-h-screen bg-[#FBFCFD] pb-24 md:pb-10">
      <OwnerAppBar
        variant="home"
        dir={dir}
        creditsLabel={`${adCredits} ${copy.adCredits}`}
        avatarInitial={businessName.trim().charAt(0).toUpperCase()}
      />

      <div className="mx-auto max-w-3xl px-5 pt-[22px]">
        {unseenMilestoneTier && unseenMilestoneBonus != null && (
          <MilestoneAnnouncement tier={unseenMilestoneTier as PromotionLevel} bonus={unseenMilestoneBonus} />
        )}

        {/* Title block */}
        <div className="mb-5 flex items-center gap-2.5">
          <h1 className="text-[27px] font-black leading-[1.15] tracking-[-0.01em]">{businessName}</h1>
          <LevelBadge level={promotionLevel} variant="chip" locale={locale} />
        </div>
        <p className="-mt-4 mb-5 text-[13px] text-[#8a8a8a]">
          {CATEGORY_LABELS[locale][businessCategory] ?? businessCategory} ·{' '}
          {copy.redemptionCountShort.replace('{n}', String(promotionScore))}
        </p>

        <SubscriptionBanner isSubscriptionActive={isSubscriptionActive} adCredits={adCredits} />

        {/* Credits hero card */}
        <div
          className="mb-3.5 rounded-[22px] p-[22px] text-white shadow-[0_14px_28px_-14px_rgba(30,58,138,0.55)]"
          style={{
            background: isSubscriptionActive
              ? 'linear-gradient(135deg,#1E3A8A,#3B5BC4)'
              : 'linear-gradient(135deg,#9ca3af,#6b7280)',
          }}
        >
          <div className="mb-3.5 flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-[0.08em] text-white/75">{copy.adCredits}</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="1" y="4" width="22" height="16" rx="2" />
              <path d="M1 10h22" />
            </svg>
          </div>
          <div className="text-[44px] font-black leading-[0.95]">{adCredits}</div>

          {activeCampaign && runwayViews !== null && (
            <p className="mt-3 text-[12.5px] leading-[1.5] text-white/85">
              {copy.creditsRunway.replace('{n}', String(runwayViews)).replace('{bid}', String(activeCampaign.bid_per_view))}
            </p>
          )}

          <a
            href="/dashboard/billing"
            className="mt-3.5 inline-block rounded-full bg-white px-4 py-[9px] text-[13px] font-semibold text-[#1E3A8A]"
          >
            {copy.topUpBalance}
          </a>
        </div>

        {/* Stat tiles, 2-up */}
        <div className="mb-[26px] grid grid-cols-2 gap-3">
          <StatTile value={scansHosted} label={copy.scansHosted} />
          <StatTile value={customersAcquired} label={copy.customersAcquired} />
        </div>

        {/* Active offer */}
        <div className="mb-[26px]">
          <div className="mb-2.5 flex items-center justify-between">
            <h2 className="text-[13px] font-semibold tracking-[0.06em] text-[#8a8a8a]">{copy.activeOfferHeading}</h2>
            <button type="button" onClick={openCampaignForm} className="text-[13px] font-semibold text-[#FF6B4A]">
              {campaignsCopy.newCampaign}
            </button>
          </div>

          {toggleError && <p className="mb-2 text-sm text-red-600">{toggleError}</p>}

          {activeCampaign ? (
            <div className="rounded-[18px] border border-[#ececec] bg-white p-3.5 transition-transform active:scale-[0.99]">
              <div className="flex items-center gap-3">
                <div className="h-[62px] w-[62px] shrink-0 overflow-hidden rounded-[14px]">
                  {activeCampaign.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={activeCampaign.image_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div
                      className="h-full w-full"
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(45deg,#f0f0f0 0 5px,#f8f8f8 5px 10px)',
                      }}
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#16a34a]" aria-hidden="true" />
                    <span className="text-[11px] font-semibold text-[#16a34a]">{campaignsCopy.active}</span>
                  </div>
                  <div className="truncate text-[15px] font-semibold leading-[1.3]">{activeCampaign.title}</div>
                  <div className="text-[12.5px] text-[#8a8a8a]">
                    {campaignsCopy.creditsPerView.replace('{n}', String(activeCampaign.bid_per_view))}
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={activeCampaign.is_active}
                  onClick={() => handleToggleActive(activeCampaign.id, activeCampaign.is_active)}
                  className="relative h-7 w-[46px] shrink-0 rounded-full bg-[#FF6B4A] p-[3px]"
                >
                  <span
                    className={`block h-[22px] w-[22px] rounded-full bg-white transition-transform duration-[180ms] ease-out ${
                      activeCampaign.is_active ? (dir === 'rtl' ? '-translate-x-[18px]' : 'translate-x-[18px]') : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <div className="mt-3 border-t border-[#f2f2f2] pt-3">
                <a href={`/offers/${activeCampaign.id}`} className="flex items-center gap-1.5 text-[13px] font-medium text-[#1E3A8A]">
                  {copy.previewAsCustomer}
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true" className={dir === 'rtl' ? 'scale-x-[-1]' : ''}>
                    <path d="M6 3.5L10.5 8L6 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={openCampaignForm}
              className="w-full rounded-[18px] border border-dashed border-[#dcdcdc] p-5 text-center text-[14px] font-medium text-[#5a5a5a]"
            >
              {campaignsCopy.noCampaigns} {campaignsCopy.newCampaign}
            </button>
          )}
        </div>

        {/* QR stand row */}
        <div className="mb-3 flex items-center gap-3 rounded-[18px] border border-[#ececec] bg-white p-3.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/qr/${businessId}`} alt="QR code" className="h-[52px] w-[52px] rounded-[12px]" />
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-semibold">{copy.qrStandHeading}</div>
            <div className="text-[12.5px] text-[#8a8a8a]">{copy.qrStandBody}</div>
          </div>
          <a
            href={`/api/qr/${businessId}/pdf`}
            className="shrink-0 rounded-full border border-[#e0e0e0] px-[13px] py-2 text-[12.5px] font-semibold"
          >
            PDF
          </a>
        </div>

        {/* Leaderboard drill-in row */}
        <a
          href="/dashboard/owner/leaderboard"
          className="mb-10 flex items-center gap-3 rounded-[18px] border border-[#ececec] bg-white p-3.5"
        >
          <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-[#FFF7F3]">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#FF6B4A" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 20V10M12 20V4M20 20v-7" />
            </svg>
          </div>
          <span className="flex-1 text-[14.5px] font-medium">{leaderboardCopy.heading}</span>
          <svg width="19" height="19" viewBox="0 0 16 16" fill="none" aria-hidden="true" className={dir === 'rtl' ? 'scale-x-[-1]' : ''}>
            <path d="M6 3.5L10.5 8L6 12.5" stroke="#c9c9c9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>

        <CampaignManager initialCampaigns={campaigns} showForm={showCampaignForm} onShowFormChange={setShowCampaignForm} />
      </div>

      <DashboardNav />
    </main>
  )
}

function StatTile({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="rounded-[18px] border border-[#ececec] bg-white p-4">
      <div className="text-[30px] font-bold leading-none">{value}</div>
      <div className="mt-[5px] text-[12.5px] text-[#8a8a8a]">{label}</div>
    </div>
  )
}
