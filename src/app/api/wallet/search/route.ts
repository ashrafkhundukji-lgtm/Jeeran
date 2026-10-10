/**
 * "Search everywhere" for the wallet mini-site — backs the search box on
 * the Shops tab (NearbyShopsView) and, through it, the one on Home. Unlike
 * the Shops/Offers lists themselves, which stop at the member's
 * push_radius_km, this searches every shop on Jeeran regardless of distance
 * (see search_businesses(), supabase/migrations/20261010_search_businesses.sql)
 * — a customer looking for something specific shouldn't be limited to what
 * happens to be within 5 km.
 *
 * Same signed member token as every other wallet page, so distances are
 * measured from the member's own saved location and no login is needed.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verifyMemberToken } from '@/lib/wallet/member-token'
import { CATEGORIES, CATEGORY_LABELS } from '@/lib/categories'
import type { NearbyBusiness } from '@/lib/wallet/nearby-businesses'

export const dynamic = 'force-dynamic'

const SEARCH_LIMIT = 50
// `all=1` (the Shops tab's "Everywhere" switch) lists every shop with no
// query at all — higher cap since it's a browse list, not a result set.
const BROWSE_ALL_LIMIT = 200
const MIN_QUERY_LENGTH = 2
const MAX_QUERY_LENGTH = 80

// Category labels only live in TS (CATEGORY_LABELS), so resolve "which
// categories does this query name" here, in every locale at once — a
// customer may type "cafe" while the page is in Arabic, or the reverse.
function matchingCategories(query: string): string[] {
  return CATEGORIES.filter((c) =>
    [c, ...Object.values(CATEGORY_LABELS).map((labels) => labels[c] ?? '')].some((label) =>
      label.toLowerCase().includes(query),
    ),
  )
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  const browseAll = req.nextUrl.searchParams.get('all') === '1'
  const query = (req.nextUrl.searchParams.get('q') ?? '').trim().toLowerCase().slice(0, MAX_QUERY_LENGTH)
  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 })
  if (!browseAll && query.length < MIN_QUERY_LENGTH) {
    return NextResponse.json({ error: 'query too short' }, { status: 400 })
  }

  const decoded = verifyMemberToken(token)
  if (!decoded) return NextResponse.json({ error: 'invalid token' }, { status: 401 })

  const { data: member, error } = await supabaseAdmin
    .from('wallet_members')
    .select('home_lat, home_lng, push_radius_km')
    .eq('id', decoded.memberId)
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!member) return NextResponse.json({ error: 'member not found' }, { status: 404 })

  // Escape ilike's own wildcards so a literal "%" or "_" typed by the
  // customer matches itself instead of everything.
  const pattern = browseAll ? '%' : `%${query.replace(/[\\%_]/g, (ch) => `\\${ch}`)}%`

  const { data, error: searchErr } = await supabaseAdmin.rpc('search_businesses', {
    p_lat: member.home_lat,
    p_lng: member.home_lng,
    p_pattern: pattern,
    p_categories: browseAll ? [] : matchingCategories(query),
    p_limit: browseAll ? BROWSE_ALL_LIMIT : SEARCH_LIMIT,
  })
  if (searchErr) return NextResponse.json({ error: searchErr.message }, { status: 500 })

  return NextResponse.json({
    results: (data ?? []) as NearbyBusiness[],
    radiusKm: Number(member.push_radius_km),
  })
}
