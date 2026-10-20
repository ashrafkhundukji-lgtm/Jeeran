import { NextRequest, NextResponse } from 'next/server'
import { renderJeeranQrPng } from '@/lib/qr/jeeranQr'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Not gated behind auth: the QR just encodes a public /scan/[business_id]
// URL, which is already unauthenticated by design (Sprint 1) — generating
// it isn't any more sensitive than the page it points to. Same centre
// (Jeeran mark) for every shop — see src/lib/qr/jeeranQr.ts.
export async function GET(req: NextRequest, { params }: { params: Promise<{ business_id: string }> }) {
  const { business_id } = await params
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const scanUrl = `${appUrl}/scan/${business_id}`

  const buffer = await renderJeeranQrPng(scanUrl, 512)

  return new NextResponse(new Blob([Uint8Array.from(buffer)]), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=300',
    },
  })
}
