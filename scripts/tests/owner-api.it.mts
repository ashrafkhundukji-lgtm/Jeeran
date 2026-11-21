// Integration test: the owner app's bearer-token path against the REAL
// routes and the REAL Supabase project, with temporary test owners that are
// deleted at the end (counts printed).
//
// Run (website running locally on BASE_URL with .env.local):
//   npm run build && npx next start -p 3100
//   BASE_URL=http://localhost:3100 npm run test:owner-api
//
// Test shops get no location (no geo push to real customers) and test
// offers start in 2099 (never eligible, so never shown to anyone).
import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'

process.loadEnvFile('.env.local')
const BASE = process.env.BASE_URL ?? 'http://localhost:3100'
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const admin = createClient(URL_, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })

const run = `${Date.now()}`
const password = `It-${run}-pw!`
const users: { id: string; email: string; token: string }[] = []

async function makeOwner(tag: string) {
  const email = `owner-api-it+${tag}-${run}@example.com`
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true })
  if (error) throw error
  const anon = createClient(URL_, ANON, { auth: { persistSession: false } })
  const { data: s, error: e2 } = await anon.auth.signInWithPassword({ email, password })
  if (e2) throw e2
  const u = { id: data.user.id, email, token: s.session!.access_token }
  users.push(u)
  return u
}

async function call(method: string, path: string, opts: { token?: string; auth?: string; body?: unknown } = {}) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (opts.auth !== undefined) headers.Authorization = opts.auth
  else if (opts.token) headers.Authorization = `Bearer ${opts.token}`
  const res = await fetch(`${BASE}${path}`, { method, headers, body: opts.body ? JSON.stringify(opts.body) : undefined })
  const json = await res.json().catch(() => null)
  return { status: res.status, json }
}

const offer = (title: string) => ({
  title,
  description: 'integration test',
  bid_per_view: 3,
  start_date: '2099-01-01',
  end_date: null,
  image_url: null,
})

let a: Awaited<ReturnType<typeof makeOwner>>
let b: Awaited<ReturnType<typeof makeOwner>>
let campaignA = ''

test('setup: two temporary owners', async () => {
  a = await makeOwner('a')
  b = await makeOwner('b')
})

test('no token → 401 on every app route', async () => {
  for (const [m, p] of [['GET', '/api/owner/summary'], ['POST', '/api/onboarding'], ['POST', '/api/campaigns'], ['PATCH', '/api/campaigns/00000000-0000-0000-0000-000000000000']] as const) {
    const r = await call(m, p, { body: m === 'GET' ? undefined : {} })
    assert.equal(r.status, 401, `${m} ${p}`)
  }
})

test('bad tokens → 401 (malformed, forged signature, wrong scheme)', async () => {
  const [h, p] = a.token.split('.')
  const forged = `${h}.${p}.${Buffer.from('not-the-signature').toString('base64url')}`
  for (const auth of ['Bearer nonsense', `Bearer ${forged}`, `Basic ${a.token}`, 'Bearer ']) {
    const r = await call('GET', '/api/owner/summary', { auth })
    assert.equal(r.status, 401, auth.slice(0, 20))
  }
})

test('valid owner, no shop yet → 404 no_business; onboarding → 200; again → 409', async () => {
  const before = await call('GET', '/api/owner/summary', { token: a.token })
  assert.equal(before.status, 404)
  assert.equal(before.json.code, 'no_business')
  for (const [u, name] of [[a, 'A'], [b, 'B']] as const) {
    const r = await call('POST', '/api/onboarding', {
      token: u.token,
      body: { fullName: `IT ${name}`, businessName: `TEST bearer ${name} ${run}`, category: 'cafe', latitude: null, longitude: null },
    })
    assert.equal(r.status, 200, JSON.stringify(r.json))
  }
  const again = await call('POST', '/api/onboarding', {
    token: a.token,
    body: { fullName: 'x', businessName: 'y', category: 'cafe' },
  })
  assert.equal(again.status, 409)
})

test('valid owner → 200: summary, create, edit, switch off/on', async () => {
  const s = await call('GET', '/api/owner/summary', { token: a.token })
  assert.equal(s.status, 200)
  assert.equal(s.json.business.name, `TEST bearer A ${run}`)
  assert.equal(s.json.offerStatus.showing, false)
  assert.equal(s.json.offerStatus.reason, 'no_offer')

  const c = await call('POST', '/api/campaigns', { token: a.token, body: offer('IT offer A') })
  assert.equal(c.status, 200, JSON.stringify(c.json))
  campaignA = c.json.campaign.id

  const bad = await call('POST', '/api/campaigns', { token: a.token, body: { ...offer('x'), bid_per_view: 11 } })
  assert.equal(bad.status, 400, 'same validation as the website')

  const e = await call('PATCH', `/api/campaigns/${campaignA}`, { token: a.token, body: { ...offer('IT offer A edited'), bid_per_view: 4 } })
  assert.equal(e.status, 200)
  assert.equal((await call('PATCH', `/api/campaigns/${campaignA}`, { token: a.token, body: { is_active: false } })).status, 200)
  assert.equal((await call('PATCH', `/api/campaigns/${campaignA}`, { token: a.token, body: { is_active: true } })).status, 200)

  const after_ = await call('GET', '/api/owner/summary', { token: a.token })
  const row = after_.json.campaigns.find((x: { id: string }) => x.id === campaignA)
  assert.equal(row.title, 'IT offer A edited')
  assert.equal(row.bid_per_view, 4)
  assert.equal(row.is_active, true)
  assert.equal(after_.json.offerStatus.reason, 'not_started', 'scheduled in 2099, so never shown')
})

test("another owner's offer → refused (404, as on the cookie path) and unchanged", async () => {
  const edit = await call('PATCH', `/api/campaigns/${campaignA}`, { token: b.token, body: { ...offer('hijacked'), bid_per_view: 10 } })
  assert.equal(edit.status, 404)
  const toggle = await call('PATCH', `/api/campaigns/${campaignA}`, { token: b.token, body: { is_active: false } })
  assert.equal(toggle.status, 404)
  const { data } = await admin.from('campaigns').select('title, bid_per_view, is_active').eq('id', campaignA).single()
  assert.deepEqual(data, { title: 'IT offer A edited', bid_per_view: 4, is_active: true })
  const sB = await call('GET', '/api/owner/summary', { token: b.token })
  assert.equal(sB.status, 200)
  assert.equal(sB.json.business.name, `TEST bearer B ${run}`)
  assert.equal(sB.json.campaigns.length, 0, "B never sees A's offers")
})

test('signed-out token → 401', async () => {
  const anon = createClient(URL_, ANON, { auth: { persistSession: false } })
  const { data } = await anon.auth.signInWithPassword({ email: b.email, password })
  const token = data.session!.access_token
  assert.equal((await call('GET', '/api/owner/summary', { token })).status, 200)
  await admin.auth.admin.signOut(token, 'global')
  assert.equal((await call('GET', '/api/owner/summary', { token })).status, 401)
})

after(async () => {
  const ids = users.map((u) => u.id)
  const { data: shops } = await admin.from('businesses').select('id').in('owner_id', ids)
  const shopIds = (shops ?? []).map((s) => s.id)
  if (shopIds.length) await admin.from('campaigns').delete().eq('creator_type', 'business').in('creator_id', shopIds)
  for (const id of ids) await admin.auth.admin.deleteUser(id)
  const count = async (t: string, col: string, vals: string[]) =>
    vals.length ? (await admin.from(t).select('*', { count: 'exact', head: true }).in(col, vals)).count : 0
  console.log('cleanup counts (all must be 0):', {
    users: (await Promise.all(ids.map((id) => admin.auth.admin.getUserById(id)))).filter((r) => r.data.user).length,
    profiles: await count('profiles', 'id', ids),
    businesses: await count('businesses', 'id', shopIds),
    campaigns: await count('campaigns', 'creator_id', shopIds),
    owner_offer_state: await count('owner_offer_state', 'business_id', shopIds),
    campaign_auto_translations: campaignA ? await count('campaign_auto_translations', 'campaign_id', [campaignA]) : 0,
  })
})
