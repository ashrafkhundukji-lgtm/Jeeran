import { supabaseAdmin } from './supabase-admin'

export interface BusinessImages {
  logoUrl: string | null
  coverUrl: string | null
}

// businesses.logo_url / cover_url for shops a page has ALREADY fetched (via
// nearby_active_offers() / nearby_businesses(), which don't return them).
// Read-only lookup by id — never filters or reorders the list it decorates;
// a failure just means letter avatars / category covers, as before.
export async function fetchBusinessImages(businessIds: string[]): Promise<Map<string, BusinessImages>> {
  const ids = [...new Set(businessIds)]
  if (ids.length === 0) return new Map()
  const { data } = await supabaseAdmin.from('businesses').select('id, logo_url, cover_url').in('id', ids)
  return new Map(
    (data ?? []).map((r: { id: string; logo_url: string | null; cover_url: string | null }) => [r.id, { logoUrl: r.logo_url, coverUrl: r.cover_url }]),
  )
}
