// Unit tests for the admin email check and the anonymous-route limits.
// Run: npm test
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isAdminUser, parseAdminEmails } from '../../src/lib/adminEmails.ts'
import { LIMITS, clientIpFrom, validDeviceId } from '../../src/lib/abuseLimits.ts'

const confirmed = '2026-01-01T00:00:00Z'

test('ADMIN_EMAILS parsing: comma separated, trimmed, lower-cased, junk dropped', () => {
  assert.deepEqual([...parseAdminEmails(' Ops@Example.com, second@example.org ,,not-an-email, a@b ')].sort(), ['a@b', 'ops@example.com', 'second@example.org'])
  assert.equal(parseAdminEmails(undefined).size, 0)
  assert.equal(parseAdminEmails('').size, 0)
})

test('admin only with a confirmed, listed email (case-insensitive)', () => {
  const list = 'ops@example.com'
  assert.equal(isAdminUser({ email: 'OPS@example.com', email_confirmed_at: confirmed }, list), true)
  assert.equal(isAdminUser({ email: 'ops@example.com', email_confirmed_at: null }, list), false, 'unconfirmed signup with an admin address')
  assert.equal(isAdminUser({ email: 'owner@example.com', email_confirmed_at: confirmed }, list), false)
  assert.equal(isAdminUser({ email: 'ops@example.com.evil.io', email_confirmed_at: confirmed }, list), false)
  assert.equal(isAdminUser(null, list), false)
})

test('fails closed when ADMIN_EMAILS is empty or missing', () => {
  assert.equal(isAdminUser({ email: 'ops@example.com', email_confirmed_at: confirmed }, ''), false)
  assert.equal(isAdminUser({ email: 'ops@example.com', email_confirmed_at: confirmed }, undefined), false)
})

test('client IP: first forwarded hop, else x-real-ip, junk rejected', () => {
  const h = (o: Record<string, string>) => ({ get: (k: string) => o[k] ?? null })
  assert.equal(clientIpFrom(h({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1' })), '203.0.113.7')
  assert.equal(clientIpFrom(h({ 'x-real-ip': '2001:db8::1' })), '2001:db8::1')
  assert.equal(clientIpFrom(h({ 'x-forwarded-for': '<script>' })), null)
  assert.equal(clientIpFrom(h({})), null)
})

test('device id must be a UUID', () => {
  assert.equal(validDeviceId('9b2f3c1e-1234-4abc-8def-0123456789ab'), true)
  assert.equal(validDeviceId('anything'), false)
  assert.equal(validDeviceId(undefined), false)
})

test('limits: finite, generous for shared mobile networks, bonus stricter per shop than overall', () => {
  for (const l of Object.values(LIMITS)) assert.ok(l.max > 0 && l.windowSeconds > 0)
  assert.equal(LIMITS.bonusPerIpPerShop.max, 50)
  assert.equal(LIMITS.bonusPerIp.max, 100)
  assert.equal(LIMITS.bonusPerIp.windowSeconds, 86400)
  assert.ok(LIMITS.passPerDevice.max <= LIMITS.passPerIp.max)
})
