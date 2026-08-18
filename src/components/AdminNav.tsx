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
    <nav className="flex items-center gap-1 bg-[#1E3A8A]/5 rounded-lg p-1 w-fit mb-8">
      {TABS.map((tab) => {
        const active = pathname === tab.href
        return (
          <a
            key={tab.href}
            href={tab.href}
            className={`text-sm font-medium rounded-md px-3 py-1.5 transition-colors ${
              active ? 'bg-[#1E3A8A] text-white shadow-sm' : 'text-[#5a5a5a] hover:text-[#1a1a1a]'
            }`}
          >
            {tab.label}
          </a>
        )
      })}
    </nav>
  )
}
