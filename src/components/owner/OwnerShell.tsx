'use client'

import type { ReactNode } from 'react'
import { useLocale } from '@/lib/i18n/useLocale'
import { getDir } from '@/lib/i18n/locale'
import { DASHBOARD_COPY } from '@/lib/i18n/dashboard'
import { CardIcon, ChevronBackIcon, HomeIcon, ScanIcon, UserIcon } from '@/components/customer/icons'
import { PRESS } from '@/components/customer/primitives'

export type OwnerTab = 'home' | 'redeem' | 'billing' | 'profile'

// Height of the tab bar's content row; pages reserve this plus the safe-area
// inset (and a little air) so the last element is always reachable above it.
const TAB_BAR_H = 64

// Page shell for every owner page. Phone-first: full width up to 480px; on
// wider screens the same column is centered with hairline edges and the tab
// bar is constrained to it — no separate desktop layout. `tab` = null hides
// the tab bar (full-screen flows like the campaign form, which bring their
// own sticky action bar and pass `bottomBar`).
export default function OwnerShell({
  tab,
  header,
  bottomBar,
  children,
}: {
  tab: OwnerTab | null
  header?: ReactNode
  bottomBar?: ReactNode
  children: ReactNode
}) {
  const [locale] = useLocale()
  const dir = getDir(locale)
  const reserve = tab || bottomBar ? `calc(${TAB_BAR_H + 32}px + env(safe-area-inset-bottom, 0px))` : '32px'

  return (
    <div dir={dir} lang={locale} className="min-h-dvh w-full overflow-x-clip bg-brand-cream font-body text-brand-navy-deep">
      <div className="relative mx-auto min-h-dvh w-full max-w-[480px] sm:border-x sm:border-brand-line">
        {header}
        <main className="px-4 pt-4" style={{ paddingBottom: reserve }}>
          {children}
        </main>
        {bottomBar}
        {tab && <OwnerTabBar active={tab} />}
      </div>
    </div>
  )
}

function OwnerTabBar({ active }: { active: OwnerTab }) {
  const [locale] = useLocale()
  const copy = DASHBOARD_COPY[locale].nav
  const items: { key: OwnerTab; href: string; label: string; Icon: typeof HomeIcon }[] = [
    { key: 'home', href: '/dashboard/owner', label: copy.dashboard, Icon: HomeIcon },
    { key: 'redeem', href: '/dashboard/redeem', label: copy.redeem, Icon: ScanIcon },
    { key: 'billing', href: '/dashboard/billing', label: copy.billing, Icon: CardIcon },
    { key: 'profile', href: '/dashboard/profile', label: copy.profile, Icon: UserIcon },
  ]

  return (
    <nav
      aria-label={copy.dashboard}
      className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[480px] border-t border-brand-line bg-white sm:border-x"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <ul className="flex px-2" style={{ height: TAB_BAR_H }}>
        {items.map(({ key, href, label, Icon }) => {
          const isActive = key === active
          return (
            <li key={key} className="flex flex-1">
              <a
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={`flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 text-xs ${
                  isActive ? 'font-bold text-brand-navy' : 'font-semibold text-brand-muted'
                }`}
              >
                <span
                  className={`flex h-8 w-14 items-center justify-center rounded-full transition-colors ${
                    isActive ? 'bg-brand-navy text-white' : ''
                  }`}
                >
                  <Icon size={22} strokeWidth={isActive ? 2.2 : 2} />
                </span>
                <span className="leading-tight">{label}</span>
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

// Sticky top bar. `home`: the navy/coral Jeeran mark + a balance chip that
// links to billing. `subpage`: back button + title (+ optional trailing slot).
export function OwnerTopBar(
  props:
    | { variant: 'home'; brand: string; chip: ReactNode }
    | { variant: 'subpage'; title: string; backHref: string; backLabel: string; trailing?: ReactNode },
) {
  return (
    <header className="sticky top-0 z-20 flex min-h-[60px] items-center gap-2 border-b border-brand-line bg-brand-cream/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-brand-cream/85">
      {props.variant === 'home' ? (
        <>
          <a href="/dashboard/owner" className="flex min-h-11 items-center gap-2 px-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/design/jeeran-mark-navy.svg" alt="" width={30} height={30} className="h-[30px] w-[30px]" />
            <span className="font-display text-[19px] font-bold text-brand-navy-deep">{props.brand}</span>
          </a>
          <div className="ms-auto">{props.chip}</div>
        </>
      ) : (
        <>
          <a
            href={props.backHref}
            aria-label={props.backLabel}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-brand-navy active:bg-brand-tint ${PRESS}`}
          >
            <ChevronBackIcon size={24} />
          </a>
          <h1 className="min-w-0 flex-1 truncate font-display text-[18px] font-semibold text-brand-navy-deep">{props.title}</h1>
          {props.trailing ?? <span className="h-11 w-11 shrink-0" aria-hidden="true" />}
        </>
      )}
    </header>
  )
}
