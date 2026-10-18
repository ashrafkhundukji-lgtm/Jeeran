// One-time migration: moves existing Google Wallet membership passes onto
// the navy/coral/cream look (hexBackgroundColor, logo, heroImage from
// src/lib/wallet/pass-brand.json). New passes get these at creation
// (createMembershipObject); patchMembershipObject() does not resend them, so
// objects issued before this change keep the old plum look until this runs.
//
// Run by hand, after the new PNGs are live on production (Google fetches
// the URLs in pass-brand.json itself — a 404 there would blank the images):
//   node scripts/migrate-wallet-pass-brand.mjs --dry-run      # lists, no Google calls
//   node scripts/migrate-wallet-pass-brand.mjs --only <member_id>
//   node scripts/migrate-wallet-pass-brand.mjs
//
// PATCHes ONLY those three fields — card text, links, locations, barcode
// and messages are left exactly as they are. Idempotent: each object is
// read first and skipped when all three already match. Rows without a
// google_object_id are skipped. Logs a line per member and exits 1 if
// anything failed, same as scripts/migrate-wallet-card-title.mjs.

import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { GoogleAuth } from 'google-auth-library'

const BASE_URL = 'https://walletobjects.googleapis.com/walletobjects/v1'
const brand = JSON.parse(readFileSync(new URL('../src/lib/wallet/pass-brand.json', import.meta.url), 'utf8'))

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const onlyIndex = args.indexOf('--only')
const ONLY = onlyIndex === -1 ? null : args[onlyIndex + 1]
if (onlyIndex !== -1 && !ONLY) {
  console.error('--only needs a wallet_members id')
  process.exit(1)
}

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

function alreadyBranded(object) {
  return (
    object?.hexBackgroundColor?.toUpperCase() === brand.hexBackgroundColor.toUpperCase() &&
    object?.logo?.sourceUri?.uri === brand.logoUrl &&
    object?.heroImage?.sourceUri?.uri === brand.heroImageUrl
  )
}

async function main() {
  let query = supabase.from('wallet_members').select('id, google_object_id, origin_business_id').order('created_at')
  if (ONLY) query = query.eq('id', ONLY)
  const { data: rows, error } = await query
  if (error) throw error

  // Labels test rows in the log (wallet_members has no name of its own; a
  // ZZTEST member is one that signed up at a ZZTEST shop). Label only — they
  // are migrated like any other row.
  const originIds = [...new Set(rows.map((r) => r.origin_business_id).filter(Boolean))]
  const { data: shops, error: shopErr } = originIds.length
    ? await supabase.from('businesses').select('id, name').in('id', originIds)
    : { data: [], error: null }
  if (shopErr) throw shopErr
  const testShops = new Set(shops.filter((s) => /^ZZTEST/i.test(s.name ?? '')).map((s) => s.id))
  const label = (r) => (testShops.has(r.origin_business_id) ? ' [ZZTEST]' : '')

  const members = rows.filter((r) => r.google_object_id)
  const noObject = rows.filter((r) => !r.google_object_id)

  console.log(`${DRY_RUN ? 'DRY RUN — no Google calls, nothing written.\n' : ''}Target: ${JSON.stringify(brand)}`)
  console.log(`${rows.length} member row(s)${ONLY ? ` matching --only ${ONLY}` : ''}: ${members.length} with a Google object, ${noObject.length} without.\n`)
  for (const r of noObject) console.log(`SKIP member=${r.id}${label(r)} — no google_object_id`)

  if (DRY_RUN) {
    for (const r of members) console.log(`WOULD CHECK+PATCH member=${r.id}${label(r)} object=${r.google_object_id}`)
    console.log(`\nDry run done. ${members.length} object(s) would be checked and patched if not already branded.`)
    return
  }

  const { clientEmail, privateKey } = loadGoogleWalletCredentials()
  const auth = new GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: ['https://www.googleapis.com/auth/wallet_object.issuer'],
  })
  const authClient = await auth.getClient()

  const failures = []
  let succeeded = 0
  let skipped = 0

  for (const member of members) {
    const tag = `member=${member.id}${label(member)} object=${member.google_object_id}`
    try {
      const { data: existing } = await authClient.request({
        url: `${BASE_URL}/genericObject/${member.google_object_id}`,
        method: 'GET',
      })
      if (alreadyBranded(existing)) {
        console.log(`SKIP ${tag} — already branded`)
        skipped += 1
        continue
      }

      await authClient.request({
        url: `${BASE_URL}/genericObject/${member.google_object_id}`,
        method: 'PATCH',
        data: {
          hexBackgroundColor: brand.hexBackgroundColor,
          logo: { sourceUri: { uri: brand.logoUrl } },
          heroImage: { sourceUri: { uri: brand.heroImageUrl } },
        },
      })
      console.log(`OK   ${tag} — was ${existing?.hexBackgroundColor ?? '(no colour)'}`)
      succeeded += 1
    } catch (err) {
      const message = err?.response?.data?.error?.message || err?.message || String(err)
      console.error(`FAIL ${tag} — ${message}`)
      failures.push({ memberId: member.id, objectId: member.google_object_id, message })
    }
  }

  console.log(`\nDone. ${succeeded} updated, ${skipped} already branded, ${failures.length} failed (of ${members.length}).`)
  if (failures.length) {
    console.log(`\n${failures.length} failure(s) — retry these with --only <member_id> after investigating:`)
    for (const f of failures) console.log(`  ${f.memberId} (object ${f.objectId}): ${f.message}`)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
