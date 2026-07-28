'use client'

import dynamic from 'next/dynamic'
import type { AdminShopRow } from '@/lib/admin'

// Leaflet touches window/document at import time — must never run during SSR.
const AdminSpreadMap = dynamic(() => import('@/components/AdminSpreadMap'), {
  ssr: false,
  loading: () => <div className="h-[520px] rounded-xl bg-neutral-100 animate-pulse" />,
})

export default function AdminSpreadMapLoader({ shops }: { shops: AdminShopRow[] }) {
  return <AdminSpreadMap shops={shops} />
}
