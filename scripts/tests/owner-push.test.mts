// Unit tests for the owner push payload builder, language fallback and
// throttle policy. Run: npm test  (node --test, native TypeScript)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildOwnerPushPayload, OWNER_PUSH_COPY, offerStatusUrl, resolvePushLocale, type OwnerPushInput } from '../../src/lib/i18n/ownerPush.ts'
import { PUSH_THROTTLE, throttleAllows } from '../../src/lib/push/throttle.ts'

const LOCALES = ['ar', 'en', 'ur'] as const
const FSI = '⁨'
const PDI = '⁩'

const SAMPLES: OwnerPushInput[] = [
  { type: 'redeemed', offerTitle: 'قهوة مجانية', creditsSpent: 4 },
  { type: 'earned', shopName: 'Salon Rose', creditsEarned: 3 },
  { type: 'signups', count: 5 },
  { type: 'offer_status', reason: 'credits', offerId: '11111111-1111-1111-1111-111111111111' },
  { type: 'trial', trialEndsAt: '2026-12-01T00:00:00Z' },
  { type: 'test' },
]

test('payload has exactly the expected fields, for every type and language', () => {
  for (const locale of LOCALES) {
    for (const input of SAMPLES) {
      const p = buildOwnerPushPayload(input, locale)
      assert.deepEqual(Object.keys(p).sort(), ['body', 'dir', 'lang', 'tag', 'title', 'type', 'url', 'v'])
      assert.equal(p.v, 1)
      assert.equal(p.type, input.type)
      assert.equal(p.tag, `jeeran-${input.type}`)
      assert.equal(p.lang, locale)
      assert.equal(p.dir, locale === 'en' ? 'ltr' : 'rtl')
      assert.ok(p.title.length > 0 && p.body.length > 0)
      assert.ok(p.url.startsWith('/dashboard/'), `url inside the app scope: ${p.url}`)
      assert.ok(Buffer.byteLength(JSON.stringify(p)) < 3000, 'well under the push size limit')
    }
  }
})

test('redeemed: offer name isolated, credits only when spent', () => {
  const en = buildOwnerPushPayload({ type: 'redeemed', offerTitle: 'Free coffee', creditsSpent: 4 }, 'en')
  assert.equal(en.title, 'Your offer was redeemed')
  assert.equal(en.body, `A customer redeemed “${FSI}Free coffee${PDI}”. 4 credits spent.`)
  assert.equal(en.url, '/dashboard/redeem')
  const own = buildOwnerPushPayload({ type: 'redeemed', offerTitle: 'Free coffee', creditsSpent: 0 }, 'en')
  assert.equal(own.body, `A customer redeemed “${FSI}Free coffee${PDI}”.`)
  const ar = buildOwnerPushPayload({ type: 'redeemed', offerTitle: 'Free coffee', creditsSpent: 2 }, 'ar')
  assert.ok(ar.body.includes(`«${FSI}Free coffee${PDI}»`) && ar.body.includes('2'))
})

test('earned / signups / trial texts', () => {
  assert.equal(
    buildOwnerPushPayload({ type: 'earned', shopName: 'Salon Rose', creditsEarned: 1 }, 'en').body,
    `A customer you brought redeemed an offer at ${FSI}Salon Rose${PDI}. +1 credit.`,
  )
  assert.equal(buildOwnerPushPayload({ type: 'signups', count: 1 }, 'en').body, 'A new customer joined through your QR stand.')
  assert.equal(buildOwnerPushPayload({ type: 'signups', count: 7 }, 'en').body, '7 new customers joined through your QR stand.')
  assert.ok(buildOwnerPushPayload({ type: 'signups', count: 7 }, 'ar').body.includes('7'))
  assert.ok(buildOwnerPushPayload({ type: 'trial', trialEndsAt: '2026-12-01T00:00:00Z' }, 'en').body.includes('1 December'))
  // Latin digits in Arabic/Urdu, same as the dashboard.
  assert.ok(buildOwnerPushPayload({ type: 'trial', trialEndsAt: '2026-12-01T00:00:00Z' }, 'ar').body.includes('1'))
})

test('offer_status: reason text and deep link for every reason', () => {
  const id = '22222222-2222-2222-2222-222222222222'
  const expected: Record<string, string> = {
    credits: '/dashboard/billing',
    subscription: '/dashboard/billing',
    frozen: '/dashboard/frozen',
    no_offer: '/dashboard/owner/campaigns/new',
    ended: `/dashboard/owner/campaigns/${id}`,
    not_started: `/dashboard/owner/campaigns/${id}`,
    switched_off: `/dashboard/owner/campaigns/${id}`,
    unknown: '/dashboard/owner',
  }
  for (const [reason, url] of Object.entries(expected)) {
    for (const locale of LOCALES) {
      const p = buildOwnerPushPayload({ type: 'offer_status', reason: reason as never, offerId: id }, locale)
      assert.equal(p.url, url)
      assert.equal(p.body, OWNER_PUSH_COPY[locale].offerStatus.reasons[reason as keyof typeof OWNER_PUSH_COPY.en.offerStatus.reasons])
    }
  }
  assert.equal(offerStatusUrl('ended', null), '/dashboard/owner')
})

test('shop-typed text cannot break out: controls stripped, long names cut', () => {
  const p = buildOwnerPushPayload({ type: 'redeemed', offerTitle: `A‮B\nC${'x'.repeat(200)}`, creditsSpent: 1 }, 'en')
  assert.ok(!p.body.includes('‮') && !p.body.includes('\n'))
  assert.ok(p.body.includes('…'))
  assert.ok(p.body.length < 140)
})

test('privacy: nothing beyond the declared inputs reaches the payload', () => {
  const sneaky = { type: 'signups', count: 2, customerName: 'Ali', phone: '+966500000000', lat: 24.7 } as unknown as OwnerPushInput
  const json = JSON.stringify(buildOwnerPushPayload(sneaky, 'en'))
  assert.ok(!json.includes('Ali') && !json.includes('+966') && !json.includes('24.7'))
})

test('language fallback: unknown or missing → Arabic', () => {
  for (const v of ['fr', '', null, undefined, 42, 'AR', 'en-US']) assert.equal(resolvePushLocale(v), 'ar')
  for (const v of LOCALES) assert.equal(resolvePushLocale(v), v)
  const p = buildOwnerPushPayload({ type: 'test' }, 'de')
  assert.equal(p.lang, 'ar')
  assert.equal(p.title, OWNER_PUSH_COPY.ar.test.title)
  assert.equal(p.dir, 'rtl')
})

test('throttle policy: signups collapse to one an hour; others a few per hour', () => {
  assert.deepEqual(PUSH_THROTTLE.signups, { max: 1, windowSeconds: 3600 })
  for (const t of ['redeemed', 'earned', 'offer_status'] as const) {
    assert.equal(PUSH_THROTTLE[t].windowSeconds, 3600)
    assert.ok(PUSH_THROTTLE[t].max >= 1 && PUSH_THROTTLE[t].max <= 6)
  }
  const now = new Date('2026-11-20T12:00:00Z')
  const minsAgo = (m: number) => new Date(now.getTime() - m * 60_000)
  assert.equal(throttleAllows('signups', [], now), true)
  assert.equal(throttleAllows('signups', [minsAgo(59)], now), false)
  assert.equal(throttleAllows('signups', [minsAgo(61)], now), true)
  assert.equal(throttleAllows('redeemed', [1, 2, 3, 4, 5].map(minsAgo), now), true)
  assert.equal(throttleAllows('redeemed', [1, 2, 3, 4, 5, 6].map(minsAgo), now), false)
  assert.equal(throttleAllows('trial', [minsAgo(60 * 24 * 29)], now), false)
  assert.equal(throttleAllows('trial', [minsAgo(60 * 24 * 31)], now), true)
})
