// One-time migration: corrects cardTitle on Google Wallet membership pass
// OBJECTS that were created before this field was set correctly (some
// pre-launch objects were created directly against the Wallet API during
// early testing with a "[TEST ONLY] Jeeran Offers" title — that string never
// existed in this repo's code; see the object-vs-class investigation notes).
//
// cardTitle is an OBJECT-level field, not a class field (confirmed: neither
// ensureMembershipClass()'s genericClass payload nor Google's Generic pass
// schema carries a class-level cardTitle default for this class), so this is
// fixable per-object via PATCH — no class-level change needed, and
// ensureMembershipClass()'s idempotent GET-then-create check is irrelevant
// here (it only ever touches the class, never the field this script fixes).
//
// New objects already get this right at creation (createMembershipObject);
// this script is only for the backlog of existing wallet_members rows with a
// google_object_id already issued. patchMembershipObject() now also carries
// cardTitle on every geo-push PATCH going forward, so this script's fix is
// permanent for any object that gets a future geo-push — this run just makes
// it immediate for objects sitting untouched until then.
//
// Same pattern as scripts/migrate-wallet-branding.mjs. Not part of the
// request-serving code path — run by hand, once:
//   node scripts/migrate-wallet-card-title.mjs
//
// Reads Supabase + Google Wallet creds from .env.local. Logs a line per
// member (success or failure) rather than swallowing errors, and exits 1 if
// anything failed so a failure can't be mistaken for a clean run.

import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { GoogleAuth } from 'google-auth-library'

const BASE_URL = 'https://walletobjects.googleapis.com/walletobjects/v1'
const CORRECT_TITLE = 'Jeeran Offers'

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
  let skipped = 0

  for (const member of members) {
    try {
      const { data: existing } = await authClient.request({
        url: `${BASE_URL}/genericObject/${member.google_object_id}`,
        method: 'GET',
      })
      const currentTitle = existing?.cardTitle?.defaultValue?.value
      if (currentTitle === CORRECT_TITLE) {
        console.log(`SKIP member=${member.id} object=${member.google_object_id} — already correct`)
        skipped += 1
        continue
      }

      await authClient.request({
        url: `${BASE_URL}/genericObject/${member.google_object_id}`,
        method: 'PATCH',
        data: {
          cardTitle: { defaultValue: { language: 'en', value: CORRECT_TITLE } },
        },
      })
      console.log(`OK   member=${member.id} object=${member.google_object_id} — was "${currentTitle}"`)
      succeeded += 1
    } catch (err) {
      const message = err?.response?.data?.error?.message || err?.message || String(err)
      console.error(`FAIL member=${member.id} object=${member.google_object_id} — ${message}`)
      failures.push({ memberId: member.id, objectId: member.google_object_id, message })
    }
  }

  console.log(`\nDone. ${succeeded} updated, ${skipped} already correct, ${failures.length} failed (of ${members.length}).`)
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
