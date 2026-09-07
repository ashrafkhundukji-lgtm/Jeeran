// Sticky mark-only header for the wallet mini-site's top-level tabs
// (WalletHomeView, NearbyOffersView, NearbyShopsView, WalletLanguagePicker —
// each already has WalletTabBar for bottom navigation, so this needs no
// back button or trailing action, unlike OwnerAppBar on the owner side).
// Replaces the full 800x500 SiteLogo lockup those pages used to render
// inline above their heading — same "small mark, sticky chrome" identity
// OwnerAppBar gave the owner cluster (design_handoff_jeeran_mobile).
// OfferPageView deliberately doesn't use this — its floating back button
// over the hero image is its own established pattern (see that
// component's header comment).
export default function WalletAppBar({ token }: { token: string }) {
  return (
    <header className="sticky top-0 z-20 border-b border-[#ececec] bg-white px-6 py-3 sm:px-8">
      <a href={`/wallet/home?token=${encodeURIComponent(token)}`} className="inline-flex">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/design/jeeran-mark.svg" alt="Jeeran" className="h-7 w-7" />
      </a>
    </header>
  )
}
