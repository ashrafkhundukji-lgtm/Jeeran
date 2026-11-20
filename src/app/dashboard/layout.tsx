import type { Metadata, Viewport } from 'next'
import OwnerAppRuntime from '@/components/owner/OwnerAppRuntime'

// Owner app (installable PWA). Only owner pages link the manifest
// (/owner.webmanifest, scope /dashboard/) and register the service worker,
// so installing never captures customer pages. viewportFit: 'cover' makes
// env(safe-area-inset-*) non-zero on notched phones, which the fixed tab bar
// and sticky action bars pad by.
export const metadata: Metadata = {
  manifest: '/owner.webmanifest',
  appleWebApp: { capable: true, title: 'جيران', statusBarStyle: 'default' },
  icons: { apple: '/owner-app/apple-touch-icon-180.png' },
}

export const viewport: Viewport = {
  themeColor: '#1E3A8A',
  viewportFit: 'cover',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <OwnerAppRuntime />
    </>
  )
}
