import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Shared guard for /api/owner/push/*: signed-in owner of a shop (401/403),
// small JSON body only (413/400), rate limited per user and route (429).

export const MAX_BODY_BYTES = 4096

export interface OwnerCaller {
  userId: string
  businessId: string
}

export type Guarded<T> = { ok: true; caller: OwnerCaller; body: T } | { ok: false; response: NextResponse }

const fail = (status: number, error: string): { ok: false; response: NextResponse } => ({
  ok: false,
  response: NextResponse.json({ error }, { status }),
})

export async function guardOwnerRequest<T = Record<string, unknown>>(
  req: NextRequest,
  route: string,
  limit: { max: number; windowSeconds: number },
  opts: { readBody?: boolean } = { readBody: true },
): Promise<Guarded<T>> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return fail(401, 'Not authenticated')

  const { data: business, error } = await supabase.from('businesses').select('id').eq('owner_id', user.id).maybeSingle()
  if (error) return fail(500, error.message)
  if (!business) return fail(403, 'No shop on this account')

  const { data: allowed, error: rateErr } = await supabaseAdmin.rpc('owner_push_api_hit', {
    p_key: `${route}:${user.id}`,
    p_max: limit.max,
    p_window_seconds: limit.windowSeconds,
  })
  if (rateErr) return fail(500, rateErr.message)
  if (!allowed) return fail(429, 'Too many requests, try again later')

  let body = {} as T
  if (opts.readBody !== false) {
    const declared = Number(req.headers.get('content-length') ?? 0)
    if (declared > MAX_BODY_BYTES) return fail(413, 'Request too large')
    const text = await req.text()
    if (text.length > MAX_BODY_BYTES) return fail(413, 'Request too large')
    if (text) {
      try {
        const parsed = JSON.parse(text)
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return fail(400, 'Invalid body')
        body = parsed as T
      } catch {
        return fail(400, 'Invalid JSON')
      }
    }
    // A request naming some other shop is refused outright.
    const named = (body as Record<string, unknown>).businessId
    if (named !== undefined && named !== business.id) return fail(403, 'Not your shop')
  }

  return { ok: true, caller: { userId: user.id, businessId: business.id }, body }
}

// Push services we accept endpoints from: any https URL with a host name,
// no credentials, no custom port, no IP literal, sane length.
export function validEndpoint(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 1024) return false
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return false
  }
  if (url.protocol !== 'https:') return false
  if (url.username || url.password || url.port) return false
  if (/^[\d.]+$/.test(url.hostname) || url.hostname.includes(':') || !url.hostname.includes('.')) return false
  return true
}

const B64URL = /^[A-Za-z0-9_-]+={0,2}$/
export function validKey(value: unknown, min: number, max: number): value is string {
  return typeof value === 'string' && value.length >= min && value.length <= max && B64URL.test(value)
}

export function cleanLabel(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const label = value.replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 80)
  return label || null
}

export const PREF_KEYS = ['redeemed', 'earned', 'signups', 'offer_status', 'trial'] as const
