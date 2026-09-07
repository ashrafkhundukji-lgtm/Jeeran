// Sticky header for the owner cluster (dashboard home, billing, profile,
// leaderboard). Two variants per the mobile redesign handoff
// (design_handoff_jeeran_mobile/README.md, "Shared components → OwnerAppBar"):
// `home` shows the brand mark + a credits pill + avatar; `subpage` shows a
// back button + centered title + an optional trailing text action (e.g.
// "Save" on profile). Sits above DashboardNav's fixed bottom tab bar — each
// page keeps its own scroll-area padding, same convention DashboardNav's own
// comment describes for the bottom bar.
//
// Callers pass already-localized strings (creditsLabel, title, backLabel,
// trailingAction.label) rather than a locale/copy object — this component
// only knows about layout and direction, not DASHBOARD_COPY's shape.
type OwnerAppBarProps =
  | {
      variant: 'home'
      dir: 'ltr' | 'rtl'
      creditsLabel: string
      creditsHref?: string
      avatarInitial: string
      avatarHref?: string
    }
  | {
      variant: 'subpage'
      dir: 'ltr' | 'rtl'
      title: string
      backHref: string
      backLabel: string
      trailingAction?: { label: string; onClick: () => void; disabled?: boolean }
    }

export default function OwnerAppBar(props: OwnerAppBarProps) {
  return (
    <header
      dir={props.dir}
      className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-[#ececec] bg-white px-5 pt-2 pb-3"
    >
      {props.variant === 'home' ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/design/jeeran-mark.svg" alt="Jeeran" className="h-[26px] w-[26px]" />
          <div className="flex items-center gap-2.5">
            <a
              href={props.creditsHref ?? '/dashboard/billing'}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF7F3] px-3 py-1.5 text-[13px] font-semibold text-[#1a1a1a]"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF6B4A]" aria-hidden="true" />
              {props.creditsLabel}
            </a>
            <a
              href={props.avatarHref ?? '/dashboard/profile'}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1E3A8A] text-[14px] font-semibold text-white"
            >
              {props.avatarInitial}
            </a>
          </div>
        </>
      ) : (
        <>
          <a
            href={props.backHref}
            aria-label={props.backLabel}
            className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-[#f4f4f4] text-[#1a1a1a]"
          >
            <svg
              width="19"
              height="19"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
              className={props.dir === 'rtl' ? 'scale-x-[-1]' : ''}
            >
              <path
                d="M10 3.5L5.5 8L10 12.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
          <h1 className="flex-1 truncate text-center text-[16px] font-semibold text-[#1a1a1a]">{props.title}</h1>
          {props.trailingAction ? (
            <button
              type="button"
              onClick={props.trailingAction.onClick}
              disabled={props.trailingAction.disabled}
              className="shrink-0 text-[14px] font-semibold text-[#FF6B4A] disabled:opacity-40"
            >
              {props.trailingAction.label}
            </button>
          ) : (
            // Reserve the same width as the back button so the title stays
            // visually centered when there's no trailing action.
            <span className="h-[34px] w-[34px] shrink-0" aria-hidden="true" />
          )}
        </>
      )}
    </header>
  )
}
