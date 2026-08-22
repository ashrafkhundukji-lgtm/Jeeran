'use client'

// Shared by both public offer pages (OfferPageView.tsx, NearbyOffersView.tsx)
// — a real, explicit "leave this page" control. Both pages navigate via
// plain <a href> (not next/link), so every hop between them is a genuine
// browser navigation that pushes a real history entry — history.back() is
// therefore always correct: from an individual offer it returns to wherever
// the customer tapped in from (the nearby list, or the Wallet card's own
// browser context if opened directly), and from the nearby list it returns
// one step further back than that. Distinct from NearbyOffersView's
// in-page "back to categories" control, which undoes client-side view state
// (category drill-down) rather than leaving the page.
export default function BackButton({ dir, label }: { dir: 'rtl' | 'ltr'; label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.history.back()}
      aria-label={label}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 transition-colors hover:bg-neutral-50 active:bg-neutral-100"
    >
      {/* Path is a left-pointing chevron ("‹") — correct for LTR "back" as
          drawn. Mirrored only in RTL, where "back" points right instead —
          same explicit-flip convention used throughout these pages rather
          than relying on CSS to do it. */}
      <svg
        width="18"
        height="18"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
        className={dir === 'rtl' ? 'scale-x-[-1]' : ''}
      >
        <path d="M10 3.5L5.5 8L10 12.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}
