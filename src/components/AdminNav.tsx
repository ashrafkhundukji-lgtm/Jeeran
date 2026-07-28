'use client'

import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/spread', label: 'Spread View' },
]

export default function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-1 bg-neutral-100 rounded-lg p-1 w-fit mb-8">
      {TABS.map((tab) => {
        const active = pathname === tab.href
        return (
          <a
            key={tab.href}
            href={tab.href}
            className={`text-sm font-medium rounded-md px-3 py-1.5 transition-colors ${
              active ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            {tab.label}
          </a>
        )
      })}
    </nav>
  )
}
