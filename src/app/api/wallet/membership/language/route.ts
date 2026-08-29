/**
 * Lets an end customer explicitly set which language their Jeeran Offers
 * Wallet pass shows content in — see wallet_members.preferred_language
 * (supabase/migrations/20260829_wallet_preferred_language.sql) and the
 * header comment in google-membership-pass.ts for why this exists at all
 * alongside Google Wallet's own automatic per-viewer language detection,
 * which has no in-pass control a customer can reach on its own.
 *
 * Reachable only from the pass's own "Change language" link
 * (offersToLinksModule in google-membership-pass.ts) via
 * src/app/wallet/language/page.tsx — the only caller. Identifies the member
 * via the same signed-token scheme already used for the pass's barcode and
 * the "Other offers nearby" page, not a raw memberId, so this route can't be
 * used to change a stranger's pass language just by guessing a uuid.
 */

import { NextRequest, NextResponse, after } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verifyMemberToken } from '@/lib/wallet/member-token'
import { refreshMember } from '@/lib/wallet/geo-notify'
import { isLocale, type Locale } from '@/lib/i18n/locale'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const token: string | undefined = body?.token
  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 })

  // `locale: null` is a deliberate, valid value — it means "go back to
  // Google's automatic detection," not "field omitted." Only reject when
  // it's neither null nor one of the three real locale codes.
  const rawLocale = body?.locale
  const locale: Locale | null | undefined = rawLocale === null ? null : isLocale(rawLocale) ? rawLocale : undefined
  if (locale === undefined) return NextResponse.json({ error: 'invalid locale' }, { status: 400 })

  const decoded = verifyMemberToken(token)
  if (!decoded) return NextResponse.json({ error: 'invalid token' }, { status: 401 })

  const { data: member, error } = await supabaseAdmin
    .from('wallet_members')
    .select('id, google_object_id, home_lat, home_lng, push_radius_km, last_notified_offers')
    .eq('id', decoded.memberId)
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!member) return NextResponse.json({ error: 'member not found' }, { status: 404 })

  const { error: updateErr } = await supabaseAdmin
    .from('wallet_members')
    .update({ preferred_language: locale })
    .eq('id', member.id)
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  // Re-patch immediately rather than waiting for the next business-triggered
  // event or the periodic cron sweep (up to 24h away) — same reasoning as
  // the re-engagement location refresh in membership/create/route.ts.
  // force: true because the offer SET is unaffected by a language change;
  // only which language it renders in has moved, which offerVersionsEqual
  // can't see (see refreshMember()'s own comment on this flag). Wrapped in
  // after(): an unawaited promise alone isn't guaranteed to run to
  // completion on Vercel.
  if (member.google_object_id) {
    const objectId = member.google_object_id
    after(() =>
      refreshMember(
        {
          id: member.id,
          google_object_id: objectId,
          home_lat: member.home_lat,
          home_lng: member.home_lng,
          push_radius_km: member.push_radius_km,
          last_notified_offers: member.last_notified_offers ?? {},
          preferred_language: locale,
        },
        { force: true },
      ).catch((err) => {
        console.error('language-change refresh failed', { memberId: member.id, err })
      }),
    )
  }

  return NextResponse.json({ ok: true })
}
