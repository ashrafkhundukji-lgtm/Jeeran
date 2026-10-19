import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { fetchLogo, renderLogoQrPng } from '@/lib/qr/logoQr'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Not gated behind auth: the QR just encodes a public /scan/[business_id]
// URL, which is already unauthenticated by design (Sprint 1) — generating
// it isn't any more sensitive than the page it points to. The centre shows
// the shop's logo (or the Jeeran mark) — see src/lib/qr/logoQr.ts.
export async function GET(req: NextRequest, { params }: { params: Promise<{ business_id: string }> }) {
  const { business_id } = await params
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const scanUrl = `${appUrl}/scan/${business_id}`

  const { data: business } = await supabaseAdmin.from('businesses').select('logo_url').eq('id', business_id).maybeSingle()
  const buffer = await renderLogoQrPng(scanUrl, await fetchLogo(business?.logo_url), 512)

  return new NextResponse(new Blob([Uint8Array.from(buffer)]), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
