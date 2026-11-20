import type { MetadataRoute } from 'next'

// Owner app manifest, served at /owner.webmanifest and linked ONLY from the
// owner layout (src/app/dashboard/layout.tsx).
//
// Not the root app/manifest.ts convention on purpose: that file is linked
// from every page, which would offer "install" on customer pages too.
//
// Scope /dashboard/: every owner screen (home, onboarding, scan/redeem,
// coupon validate, offers, credits/billing, profile, notifications) lives
// under it, and nothing customer-facing does — so the installed app never
// captures a customer link (/, /offers, /wallet, /scan, /browse).
export const dynamic = 'force-static'

type Manifest = MetadataRoute.Manifest & { id?: string; dir?: 'rtl' | 'ltr' | 'auto'; lang?: string }

export function GET() {
  const manifest: Manifest = {
    id: '/dashboard/owner',
    name: 'جيران للمحلات',
    short_name: 'جيران',
    description: 'Jeeran for Shops — manage your shop, scan coupons and get notified about your customers.',
    lang: 'ar',
    dir: 'rtl',
    start_url: '/dashboard/owner?source=app',
    scope: '/dashboard/',
    display: 'standalone',
    orientation: 'portrait',
    theme_color: '#1E3A8A',
    background_color: '#FFF8F1',
    categories: ['business', 'productivity'],
    icons: [
      { src: '/owner-app/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/owner-app/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/owner-app/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      {
        name: 'امسح كوبون — Scan a coupon',
        short_name: 'امسح كوبون',
        url: '/dashboard/redeem?source=app',
        icons: [{ src: '/owner-app/icon-192.png', sizes: '192x192', type: 'image/png' }],
      },
      {
        name: 'عرضي — My offer',
        short_name: 'عرضي',
        url: '/dashboard/owner/offer?source=app',
        icons: [{ src: '/owner-app/icon-192.png', sizes: '192x192', type: 'image/png' }],
      },
      {
        name: 'رصيدي — Credits',
        short_name: 'رصيدي',
        url: '/dashboard/billing?source=app',
        icons: [{ src: '/owner-app/icon-192.png', sizes: '192x192', type: 'image/png' }],
      },
    ],
  }
  return new Response(JSON.stringify(manifest), {
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
