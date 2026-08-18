import { getPromotionThresholds } from '@/lib/promotion'
import PromotionSettingsForm from '@/components/PromotionSettingsForm'

export const dynamic = 'force-dynamic'

export default async function AdminSettingsPage() {
  const thresholds = await getPromotionThresholds()

  return (
    <div className="max-w-md">
      <h2 className="text-lg font-semibold mb-1">Promotion Tiers</h2>
      <p className="text-sm text-[#5a5a5a] mb-6">
        Redemption-count thresholds for bronze/silver/gold/platinum, and how close two
        campaigns&apos; bids need to be before tier breaks the tie in nearby-offer ranking.
        Takes effect immediately everywhere: the wallet geo-push ranking, the browse page, and
        every shop&apos;s own dashboard badge.
      </p>
      <PromotionSettingsForm initialThresholds={thresholds} />
    </div>
  )
}
