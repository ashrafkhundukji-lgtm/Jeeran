import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ApiError, createApi } from './apiClient'

type Call = { url: string; init: RequestInit }

function harness(responses: (Response | Error)[], tokens = { access: 'tok1', refreshed: 'tok2' as string | null }) {
  const calls: Call[] = []
  let expired = 0
  const api = createApi({
    baseUrl: 'https://api.test',
    fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init })
      const next = responses.shift()
      if (!next) throw new Error('no more responses')
      if (next instanceof Error) throw next
      return next
    }) as unknown as typeof fetch,
    getAccessToken: async () => tokens.access,
    refreshAccessToken: async () => tokens.refreshed,
    onSessionExpired: () => void expired++,
  })
  return { api, calls, expired: () => expired }
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

test('sends the access token as a bearer header', async () => {
  const h = harness([json(200, { business: {}, campaigns: [] })])
  await h.api.summary()
  assert.equal(h.calls[0].url, 'https://api.test/api/owner/summary')
  assert.equal((h.calls[0].init.headers as Record<string, string>).Authorization, 'Bearer tok1')
})

test('401 → refresh once → retry with the new token', async () => {
  const h = harness([json(401, { error: 'Not authenticated' }), json(200, { success: true })])
  await h.api.setCampaignActive('c1', true)
  assert.equal(h.calls.length, 2)
  assert.equal((h.calls[1].init.headers as Record<string, string>).Authorization, 'Bearer tok2')
  assert.equal(h.calls[1].init.body, JSON.stringify({ is_active: true }))
  assert.equal(h.expired(), 0)
})

test('401 after refresh → session expired, no third request', async () => {
  const h = harness([json(401, {}), json(401, {})])
  await assert.rejects(h.api.summary(), (e: ApiError) => e.status === 401)
  assert.equal(h.calls.length, 2)
  assert.equal(h.expired(), 1)
})

test('refresh fails → session expired', async () => {
  const h = harness([json(401, {})], { access: 'tok1', refreshed: null })
  await assert.rejects(h.api.summary(), (e: ApiError) => e.status === 401)
  assert.equal(h.expired(), 1)
})

test('server error string and code are kept for the screen to map', async () => {
  const h = harness([json(409, { error: 'Already onboarded', code: 'already_onboarded' })])
  await assert.rejects(
    h.api.onboard({ fullName: 'a', businessName: 'b', category: 'cafe', latitude: null, longitude: null }),
    (e: ApiError) => e.status === 409 && e.code === 'already_onboarded' && e.serverError === 'Already onboarded',
  )
})

test('no response → network error (status 0)', async () => {
  const h = harness([new TypeError('Network request failed')])
  await assert.rejects(h.api.summary(), (e: ApiError) => e.isNetwork)
})

test('no session at all → expired without calling the server', async () => {
  const h = harness([], { access: null as unknown as string, refreshed: null })
  await assert.rejects(h.api.summary(), (e: ApiError) => e.status === 401)
  assert.equal(h.calls.length, 0)
  assert.equal(h.expired(), 1)
})

test('campaign id is URL-encoded', async () => {
  const h = harness([json(200, { success: true })])
  await h.api.setCampaignActive('../x', false)
  assert.equal(h.calls[0].url, 'https://api.test/api/campaigns/..%2Fx')
})
