/**
 * Shop identity images — logo + cover for one business.
 *
 *   POST   multipart { kind: 'logo' | 'cover', file }  → { url }
 *   DELETE ?kind=logo|cover                            → { ok: true }
 *
 * Only the signed-in owner of THIS business (businesses.owner_id) may call
 * it; frozen and unknown shops are rejected. The upload is validated by
 * size and by file signature (magic bytes — the declared mime type is not
 * trusted), then always re-encoded by sharp to webp: logo = centre-cropped
 * 512×512 square, cover = 16:9 at 1200×675. Re-encoding drops EXIF/GPS and
 * any payload smuggled in the original container; SVG is never accepted.
 * Objects live in the public `business-images` bucket under
 * `<business_id>/<kind>-<random uuid>.webp`. Replacing or removing deletes
 * the previous object. Service-role writes only (same pattern as
 * /api/campaigns/upload-image) — the browser never gets storage write access.
 */
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import sharp from 'sharp'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BUCKET = 'business-images'
const MAX_BYTES = 2 * 1024 * 1024
const MAX_INPUT_PIXELS = 40_000_000 // refuse decompression bombs before decoding
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type Kind = 'logo' | 'cover'
const COLUMN: Record<Kind, 'logo_url' | 'cover_url'> = { logo: 'logo_url', cover: 'cover_url' }

function sniff(buf: Buffer): 'png' | 'jpeg' | 'webp' | null {
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png'
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg'
  if (buf.length >= 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'webp'
  return null
}

// Storage path of a URL we issued, or null for anything else (never delete
// an object we can't prove belongs to this business's own folder).
function ownedPath(url: string | null, businessId: string): string | null {
  if (!url) return null
  const marker = `/storage/v1/object/public/${BUCKET}/`
  const i = url.indexOf(marker)
  if (i === -1) return null
  const path = decodeURIComponent(url.slice(i + marker.length).split('?')[0])
  return path.startsWith(`${businessId}/`) && !path.includes('..') ? path : null
}

async function authorize(businessId: string) {
  if (!UUID_RE.test(businessId)) return { error: NextResponse.json({ error: 'Business not found' }, { status: 404 }) }
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) }

  const { data: business, error } = await supabaseAdmin
    .from('businesses')
    .select('id, owner_id, is_frozen, logo_url, cover_url')
    .eq('id', businessId)
    .maybeSingle()
  if (error) return { error: NextResponse.json({ error: 'Lookup failed' }, { status: 500 }) }
  if (!business) return { error: NextResponse.json({ error: 'Business not found' }, { status: 404 }) }
  if (business.owner_id !== user.id) return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  if (business.is_frozen) return { error: NextResponse.json({ error: 'This account is frozen' }, { status: 403 }) }
  return { business }
}

function parseKind(v: unknown): Kind | null {
  return v === 'logo' || v === 'cover' ? v : null
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await authorize(id)
  if (auth.error) return auth.error
  const { business } = auth

  const form = await req.formData().catch(() => null)
  const kind = parseKind(form?.get('kind'))
  const file = form?.get('file')
  if (!kind) return NextResponse.json({ error: 'kind must be logo or cover' }, { status: 400 })
  if (!file || !(file instanceof File)) return NextResponse.json({ error: 'file is required' }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'too_large' }, { status: 413 })

  const input = Buffer.from(await file.arrayBuffer())
  if (input.length > MAX_BYTES) return NextResponse.json({ error: 'too_large' }, { status: 413 })
  if (!sniff(input)) return NextResponse.json({ error: 'unsupported_type' }, { status: 415 })

  let output: Buffer
  try {
    const img = sharp(input, { limitInputPixels: MAX_INPUT_PIXELS, failOn: 'error' }).rotate() // apply EXIF orientation, then metadata is dropped
    output =
      kind === 'logo'
        ? await img.resize(512, 512, { fit: 'cover', position: 'centre' }).webp({ quality: 86 }).toBuffer()
        : await img.resize(1200, 675, { fit: 'cover', position: 'centre' }).webp({ quality: 82 }).toBuffer()
  } catch {
    return NextResponse.json({ error: 'unsupported_type' }, { status: 415 })
  }

  const path = `${business.id}/${kind}-${randomUUID()}.webp`
  const { error: uploadErr } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, output, { contentType: 'image/webp', cacheControl: '31536000', upsert: false })
  if (uploadErr) return NextResponse.json({ error: 'upload_failed' }, { status: 500 })

  const url = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
  const { error: updateErr } = await supabaseAdmin.from('businesses').update({ [COLUMN[kind]]: url }).eq('id', business.id)
  if (updateErr) {
    await supabaseAdmin.storage.from(BUCKET).remove([path])
    return NextResponse.json({ error: 'save_failed' }, { status: 500 })
  }

  const oldPath = ownedPath(business[COLUMN[kind]], business.id)
  if (oldPath) await supabaseAdmin.storage.from(BUCKET).remove([oldPath])

  return NextResponse.json({ url })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await authorize(id)
  if (auth.error) return auth.error
  const { business } = auth

  const kind = parseKind(req.nextUrl.searchParams.get('kind'))
  if (!kind) return NextResponse.json({ error: 'kind must be logo or cover' }, { status: 400 })

  const { error: updateErr } = await supabaseAdmin.from('businesses').update({ [COLUMN[kind]]: null }).eq('id', business.id)
  if (updateErr) return NextResponse.json({ error: 'save_failed' }, { status: 500 })

  const oldPath = ownedPath(business[COLUMN[kind]], business.id)
  if (oldPath) await supabaseAdmin.storage.from(BUCKET).remove([oldPath])

  return NextResponse.json({ ok: true })
}
