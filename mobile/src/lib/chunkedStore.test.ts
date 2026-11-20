import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createChunkedStore, safeKey, split, type KVBackend } from './chunkedStore'

function memory(): KVBackend & { map: Map<string, string> } {
  const map = new Map<string, string>()
  return {
    map,
    getItem: async (k) => map.get(k) ?? null,
    setItem: async (k, v) => void map.set(k, v),
    removeItem: async (k) => void map.delete(k),
  }
}

test('round-trips values larger than one chunk', async () => {
  const backend = memory()
  const store = createChunkedStore(backend, 10)
  const value = 'x'.repeat(25) + 'تجربة'
  await store.setItem('sb-session', value)
  assert.equal(await store.getItem('sb-session'), value)
  assert.equal(backend.map.get('sb-session.n'), '3')
  for (const v of backend.map.values()) assert.ok(v.length <= 10)
})

test('shrinking a value removes the old chunks', async () => {
  const backend = memory()
  const store = createChunkedStore(backend, 10)
  await store.setItem('k', 'a'.repeat(35))
  await store.setItem('k', 'short')
  assert.equal(await store.getItem('k'), 'short')
  assert.deepEqual([...backend.map.keys()].sort(), ['k.0', 'k.n'])
})

test('remove clears every chunk; missing key reads as null', async () => {
  const backend = memory()
  const store = createChunkedStore(backend, 10)
  await store.setItem('k', 'a'.repeat(35))
  await store.removeItem('k')
  assert.equal(backend.map.size, 0)
  assert.equal(await store.getItem('k'), null)
})

test('a half-written value reads as null, not as a truncated string', async () => {
  const backend = memory()
  const store = createChunkedStore(backend, 10)
  await store.setItem('k', 'a'.repeat(35))
  backend.map.delete('k.2')
  assert.equal(await store.getItem('k'), null)
})

test('empty string is stored, keys are made SecureStore-safe', async () => {
  const store = createChunkedStore(memory(), 10)
  await store.setItem('k', '')
  assert.equal(await store.getItem('k'), '')
  assert.equal(safeKey('sb-abc-auth-token:code verifier'), 'sb-abc-auth-token_code_verifier')
})

test('never splits a surrogate pair', () => {
  const value = 'abcdefghi\u{1F600}xyz'
  const parts = split(value, 10)
  assert.equal(parts.join(''), value)
  for (const p of parts) assert.ok(!/[\uD800-\uDBFF]$/.test(p) && !/^[\uDC00-\uDFFF]/.test(p))
})
