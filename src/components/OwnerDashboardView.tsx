'use client'

import DashboardNav from '@/components/DashboardNav'
import CampaignManager from '@/components/CampaignManager'
import SubscriptionBanner from '@/components/SubscriptionBanner'
import LevelBadge from '@/components/LevelBadge'
import NewCustomerLeaderboard from '@/components/NewCustomerLeaderboard'
import MilestoneAnnouncement from '@/components/MilestoneAnnouncement'
import { useLocale } from '@/lib/i18n/useLocale'
import { getDir } from '@/lib/i18n/locale'
import { DASHBOARD_COPY } from '@/lib/i18n/dashboard'
import type { PromotionLevel } from '@/lib/promotion'

interface Campaign {
  id: string
  title: string
  description: string | null
  bid_per_view: number
  is_active: boolean
  start_date: string | null
  end_date: string | null
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

  return (
    <main dir={dir} className="max-w-3xl mx-auto px-4 py-10">
      <DashboardNav />

      {unseenMilestoneTier && unseenMilestoneBonus != null && (
        <MilestoneAnnouncement tier={unseenMilestoneTier as PromotionLevel} bonus={unseenMilestoneBonus} />
      )}

      <div className="mb-6">
        <h1 className="text-xl font-semibold">{businessName}</h1>
        <p className="text-sm text-neutral-500 mb-2">{businessCategory}</p>
        <LevelBadge level={promotionLevel} variant="medal" locale={locale} />
        <p className="text-xs text-neutral-400 mt-1">{copy.promotionCaption.replace('{n}', String(promotionScore))}</p>
      </div>

      <NewCustomerLeaderboard businessId={businessId} />

      <SubscriptionBanner isSubscriptionActive={isSubscriptionActive} adCredits={adCredits} />

      <div className="grid grid-cols-3 gap-3 mb-10">
        <MetricTile label={copy.adCredits} value={adCredits} />
        <MetricTile label={copy.scansHosted} value={scansHosted} />
        <MetricTile label={copy.customersAcquired} value={customersAcquired} />
      </div>

      <CampaignManager initialCampaigns={campaigns} />

      <section className="mt-10">
        <h2 className="text-lg font-semibold mb-3">{copy.qrStandHeading}</h2>
        <div className="border border-neutral-200 rounded-xl p-4 flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/qr/${businessId}`} alt="QR code" className="w-32 h-32" />
          <div>
            <p className="text-sm text-neutral-600 mb-3">{copy.qrStandBody}</p>
            <a
              href={`/api/qr/${businessId}/pdf`}
              className="inline-block bg-[#FF6B4A] text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors hover:bg-[#e85a3b]"
            >
              {copy.downloadPdf}
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}

function MetricTile({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border border-neutral-200 rounded-xl p-4 text-center">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs text-neutral-500 mt-1">{label}</div>
    </div>
  )
}
