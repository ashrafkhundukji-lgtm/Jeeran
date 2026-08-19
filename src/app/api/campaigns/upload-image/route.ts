import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { getAuthenticatedBusinessId } from '@/lib/business-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const BUCKET = 'campaign-images'
const MAX_BYTES = 5 * 1024 * 1024 // 5MB — a phone photo comfortably fits; keeps the Wallet card's image fetch fast
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

// Uploads go through the server (service role), not a direct client-to-Storage
// path — matches this app's existing pattern of API routes fronting
// supabaseAdmin rather than exposing a browser-side Supabase client with
// write access. Scoped to the caller's own business only (path is prefixed
// with businessId), even though the bucket itself is public-read.
export async function POST(req: NextRequest) {
  const businessId = await getAuthenticatedBusinessId()
  if (!businessId) {
    return NextResponse.json({ error: 'not authenticated as a business' }, { status: 401 })
  }

  const formData = await req.formData().catch(() => null)
  const file = formData?.get('file')
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'file is required' }, { status: 400 })
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, or WebP images are allowed' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Image must be under 5MB' }, { status: 400 })
  }

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${businessId}/${randomUUID()}.${ext}`

  const { error: uploadErr } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: false })

  if (uploadErr) {
    return NextResponse.json({ error: uploadErr.message }, { status: 500 })
  }

  const { data: publicUrlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path)
  return NextResponse.json({ url: publicUrlData.publicUrl })
}
