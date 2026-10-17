import type { Metadata, Viewport } from 'next'

// Owner-dashboard-only install metadata: a manifest scoped to /dashboard/
// (so installing never captures customer pages) and iOS home-screen
// support. viewportFit: 'cover' makes env(safe-area-inset-*) non-zero on
// notched phones, which the fixed tab bar and sticky action bars pad by.
export const metadata: Metadata = {
  manifest: '/dashboard.webmanifest',
  appleWebApp: { capable: true, title: 'Jeeran', statusBarStyle: 'default' },
  icons: { apple: '/design/apple-touch-icon-owner.png' },
}

export const viewport: Viewport = {
  themeColor: '#1E3A8A',
  viewportFit: 'cover',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children
}
