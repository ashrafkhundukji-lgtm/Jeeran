'use client'

import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/spread', label: 'Spread View' },
  { href: '/admin/settings', label: 'Settings' },
]

export default function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="mb-8 flex w-fit items-center gap-1 rounded-2xl bg-brand-tint p-1">
      {TABS.map((tab) => {
        const active = pathname === tab.href
        return (
          <a
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={`flex min-h-10 items-center rounded-xl px-4 text-sm font-semibold transition-colors ${
              active ? 'bg-brand-navy text-white' : 'text-brand-muted hover:text-brand-navy-deep'
            }`}
          >
            {tab.label}
          </a>
        )
      })}
    </nav>
  )
}
