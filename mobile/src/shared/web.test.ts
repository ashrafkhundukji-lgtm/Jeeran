import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { DASHBOARD_COPY, OWNER_UI_COPY, LOGIN_COPY, CATEGORIES, CATEGORY_LABELS, SHARED_WEB_FILES } from './web'

const repoRoot = join(__dirname, '..', '..', '..')

test('shared website modules stay framework-free', () => {
  for (const file of SHARED_WEB_FILES) {
    const src = readFileSync(join(repoRoot, file), 'utf8')
    const imports = [...src.matchAll(/^import\s+(type\s+)?[^'"]*['"]([^'"]+)['"]/gm)]
    for (const [, isType, from] of imports) {
      const ok = isType || from.startsWith('./') || from.startsWith('@/lib/i18n/')
      assert.ok(ok, `${file} imports ${from} at runtime; the app cannot bundle that`)
    }
    assert.ok(!/['"]use client['"]/.test(src), `${file} is a client component`)
  }
})

test('every locale has the copy the app reads', () => {
  for (const l of ['ar', 'en', 'ur'] as const) {
    assert.ok(DASHBOARD_COPY[l].campaigns.errorBidRange)
    assert.ok(OWNER_UI_COPY[l].form.bidLabel)
    assert.ok(LOGIN_COPY[l].submit)
    for (const c of CATEGORIES) assert.ok(CATEGORY_LABELS[l][c], `${l}:${c}`)
  }
})
