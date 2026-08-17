// One-time backfill: pushes merchantLocations (see
// src/lib/wallet/google-membership-pass.ts) onto Google Wallet membership
// pass objects that were created/last-patched before that field existed.
//
// New objects already get this at creation (createMembershipObject), and
// patchMembershipObject() sends it on every future offer-set change — but
// refreshMember()'s diff check (src/lib/wallet/geo-notify.ts) skips the PATCH
// entirely when the offer set is unchanged, which it is for every
// already-synced member right now. Without this script, those members
// wouldn't get merchantLocations until their offer set next actually
// changes. Same pattern as migrate-wallet-branding.mjs /
// migrate-wallet-card-title.mjs — run by hand, once:
//   node scripts/migrate-wallet-merchant-locations.mjs
//
// Unlike those two, this recomputes nearby_active_offers() and PATCHes
// unconditionally (not diffed against wallet_members.last_notified_offers)
// since the point is specifically to backfill a field the diff-based
// trigger won't touch on its own.

import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { GoogleAuth } from 'google-auth-library'

const BASE_URL = 'https://walletobjects.googleapis.com/walletobjects/v1'

function loadEnvLocal() {
  const text = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  const env = {}
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim()
  }
  return env
}

const env = loadEnvLocal()
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

function loadGoogleWalletCredentials() {
  const { GOOGLE_WALLET_ISSUER_ID, GOOGLE_WALLET_SERVICE_ACCOUNT_KEY_B64 } = env
  if (!GOOGLE_WALLET_ISSUER_ID || !GOOGLE_WALLET_SERVICE_ACCOUNT_KEY_B64) {
    throw new Error('Google Wallet is not configured (GOOGLE_WALLET_ISSUER_ID / GOOGLE_WALLET_SERVICE_ACCOUNT_KEY_B64 missing from .env.local)')
  }
  const keyJson = JSON.parse(Buffer.from(GOOGLE_WALLET_SERVICE_ACCOUNT_KEY_B64, 'base64').toString('utf8'))
  if (!keyJson.client_email || !keyJson.private_key) {
    throw new Error('GOOGLE_WALLET_SERVICE_ACCOUNT_KEY_B64 is missing client_email or private_key')
  }
  return { clientEmail: keyJson.client_email, privateKey: keyJson.private_key }
}

function offersToMerchantLocations(offers) {
  return offers.slice(0, 10).map((o) => ({ latitude: o.business_lat, longitude: o.business_lng }))
}

async function main() {
  const { clientEmail, privateKey } = loadGoogleWalletCredentials()
  const auth = new GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: ['https://www.googleapis.com/auth/wallet_object.issuer'],
  })
  const authClient = await auth.getClient()

  const { data: members, error } = await supabase
    .from('wallet_members')
    .select('id, google_object_id, home_lat, home_lng, push_radius_km')
    .not('google_object_id', 'is', null)

  if (error) throw error

  console.log(`Found ${members.length} existing member(s) with a Google Wallet object.\n`)

  const failures = []
  let succeeded = 0

  for (const member of members) {
    try {
      const { data: offers, error: rpcErr } = await supabase.rpc('nearby_active_offers', {
        p_lat: member.home_lat,
        p_lng: member.home_lng,
        p_radius_km: member.push_radius_km,
        p_limit: 5,
      })
      if (rpcErr) throw new Error(rpcErr.message)

      const merchantLocations = offersToMerchantLocations(offers ?? [])

      await authClient.request({
        url: `${BASE_URL}/genericObject/${member.google_object_id}`,
        method: 'PATCH',
        data: { merchantLocations },
      })
      console.log(`OK   member=${member.id} object=${member.google_object_id} — ${merchantLocations.length} location(s)`)
      succeeded += 1
    } catch (err) {
      const message = err?.response?.data?.error?.message || err?.message || String(err)
      console.error(`FAIL member=${member.id} object=${member.google_object_id} — ${message}`)
      failures.push({ memberId: member.id, objectId: member.google_object_id, message })
    }
  }

  console.log(`\nDone. ${succeeded}/${members.length} updated.`)
  if (failures.length) {
    console.log(`\n${failures.length} failure(s) — retry these member_ids after investigating:`)
    for (const f of failures) console.log(`  ${f.memberId} (object ${f.objectId}): ${f.message}`)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
