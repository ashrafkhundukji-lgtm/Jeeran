// One-time backfill: pushes translatedValues (ar/ur) for cardTitle and
// header onto Google Wallet membership pass objects that existed before
// localizedString() shipped (see src/lib/wallet/google-membership-pass.ts).
//
// New objects already get this at creation, and patchMembershipObject()
// resends both fields on every future push — but refreshMember()'s diff
// check (src/lib/wallet/geo-notify.ts) only calls patchMembershipObject when
// a member's offer set actually changed, which it hasn't for anyone already
// in sync. Same pattern as migrate-wallet-card-title.mjs /
// migrate-wallet-merchant-locations.mjs — run by hand, once:
//   node scripts/migrate-wallet-localization.mjs

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

function localizedString(en, ar, ur) {
  return {
    defaultValue: { language: 'en', value: en },
    translatedValues: [
      { language: 'ar', value: ar },
      { language: 'ur', value: ur },
    ],
  }
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
          cardTitle: localizedString('Jeeran Offers', 'عروض جيران', 'جیران آفرز'),
          header: localizedString('Nearby deals for you', 'عروض قريبة منك', 'آپ کے قریب آفرز'),
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
