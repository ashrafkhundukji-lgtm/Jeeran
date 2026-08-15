// One-time migration: pushes the new brand look (navy background, square
// logo, hero banner — see src/lib/wallet/google-membership-pass.ts) onto
// Google Wallet membership passes that were already saved before that
// change shipped. New passes get these fields at creation time automatically
// (createMembershipObject); this script is only for the backlog of existing
// wallet_members rows with a google_object_id already issued.
//
// Not part of the request-serving code path — run by hand, once:
//   node scripts/migrate-wallet-branding.mjs
//
// Reads Supabase + Google Wallet creds from .env.local. Logs a line per
// member (success or failure) rather than swallowing errors, and exits 1 if
// anything failed so a failure can't be mistaken for a clean run.

import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { GoogleAuth } from 'google-auth-library'

// Keep these in sync with the constants of the same name in
// src/lib/wallet/google-membership-pass.ts — duplicated here because this
// plain-JS script can't import that TypeScript module directly.
const BRAND_NAVY = '#1E3A8A'
const LOGO_URL = 'https://jeeran.vercel.app/wallet-logo-square.png'
const HERO_IMAGE_URL = 'https://jeeran.vercel.app/wallet-hero-banner.png'
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

async function main() {
  const { clientEmail, privateKey } = loadGoogleWalletCredentials()
  const auth = new GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: ['https://www.googleapis.com/auth/wallet_object.issuer'],
  })
  const authClient = await auth.getClient()

  const { data: members, error } = await supabase
    .from('wallet_members')
    .select('id, google_object_id')
    .not('google_object_id', 'is', null)

  if (error) throw error

  console.log(`Found ${members.length} existing member(s) with a Google Wallet object.\n`)

  const failures = []
  let succeeded = 0

  for (const member of members) {
    try {
      await authClient.request({
        url: `${BASE_URL}/genericObject/${member.google_object_id}`,
        method: 'PATCH',
        data: {
          hexBackgroundColor: BRAND_NAVY,
          logo: { sourceUri: { uri: LOGO_URL } },
          heroImage: { sourceUri: { uri: HERO_IMAGE_URL } },
        },
      })
      console.log(`OK   member=${member.id} object=${member.google_object_id}`)
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
