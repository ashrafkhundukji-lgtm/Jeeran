// Unit tests for the Authorization header parser used by src/lib/requestAuth.ts.
// Run: npm test
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { bearerTokenFrom } from '../../src/lib/bearerToken.ts'

const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.c2lnbmF0dXJl'

test('no header → cookie session', () => {
  assert.equal(bearerTokenFrom(null), null)
})

test('well-formed bearer → raw token (still unverified)', () => {
  assert.equal(bearerTokenFrom(`Bearer ${jwt}`), jwt)
  assert.equal(bearerTokenFrom(`  Bearer ${jwt}  `), jwt)
})

test('anything else → invalid (401, never falls back to cookies)', () => {
  for (const h of ['', 'Bearer', 'Bearer ', `bearer ${jwt}`, `Basic ${jwt}`, 'Bearer abc', `Bearer ${jwt} extra`, `Bearer ${jwt}.x`, 'Bearer a.b.c<script>']) {
    assert.equal(bearerTokenFrom(h), 'invalid', JSON.stringify(h))
  }
  assert.equal(bearerTokenFrom(`Bearer ${'a'.repeat(5000)}.${'b'.repeat(1000)}.c`), 'invalid', 'over 4 KB')
})
