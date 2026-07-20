export default function SubscriptionBanner({
  isSubscriptionActive,
  adCredits,
}: {
  isSubscriptionActive: boolean
  adCredits: number
}) {
  if (isSubscriptionActive && adCredits > 0) return null

  return (
    <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
      {!isSubscriptionActive ? (
        <>Your subscription is inactive — your campaigns won&apos;t appear to nearby customers. </>
      ) : (
        <>You&apos;re out of ad credits — your campaigns won&apos;t appear until you top up. </>
      )}
      <a href="/dashboard/billing" className="underline font-medium">
        Manage billing
      </a>
    </div>
  )
}
