'use client'

// Used exclusively by WalletSiteHeader.tsx now, which decides WHETHER to
// render this at all (only when document.referrer shows a real same-origin
// page to return to — see that component's header comment for why an
// always-visible back control was wrong on a page opened fresh from the
// Wallet app). This component just renders the control itself.
//
// Icon-only used to be the whole button (aria-label only, no visible text)
// — a real customer flagged it as unlabeled/ambiguous. Now a visible text
// label rides alongside the chevron.
//
// Every page reachable from here navigates via plain <a href> (not
// next/link), so every hop is a genuine browser navigation that pushes a
// real history entry — history.back() is therefore always correct given
// WalletSiteHeader already confirmed one exists.
export default function BackButton({ dir, label }: { dir: 'rtl' | 'ltr'; label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.history.back()}
      className="flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50 active:bg-neutral-100"
    >
      {/* Path is a left-pointing chevron ("‹") — correct for LTR "back" as
          drawn. Mirrored only in RTL, where "back" points right instead —
          same explicit-flip convention used throughout these pages rather
          than relying on CSS to do it. */}
      <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
        className={dir === 'rtl' ? 'scale-x-[-1]' : ''}
      >
        <path d="M10 3.5L5.5 8L10 12.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label}
    </button>
  )
}
