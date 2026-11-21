import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  actionForReason,
  addDays,
  clampBid,
  formFromCampaign,
  offerToday,
  offerWindowState,
  runway,
  sortCampaigns,
  toCampaignInput,
  validateOffer,
} from './offers'
import type { Campaign } from './apiClient'

const campaign = (over: Partial<Campaign> = {}): Campaign => ({
  id: 'c1',
  title: 'Coffee 20% off',
  description: null,
  bid_per_view: 4,
  is_active: true,
  start_date: null,
  end_date: null,
  image_url: 'https://img.test/a.webp',
  title_ar: 'خصم',
  title_en: null,
  title_ur: null,
  description_ar: null,
  description_en: null,
  description_ur: null,
  created_at: '2026-11-01T10:00:00Z',
  updated_at: null,
  ...over,
})

test('validation mirrors the server: title, bid 2–10, end ≥ start', () => {
  const ok = formFromCampaign(null)
  ok.title = 'x'
  assert.deepEqual(validateOffer(ok), [])
  assert.deepEqual(validateOffer({ ...ok, title: '   ' }), ['title_required'])
  assert.deepEqual(validateOffer({ ...ok, bid: 1 }), ['bid_range'])
  assert.deepEqual(validateOffer({ ...ok, bid: 11 }), ['bid_range'])
  assert.deepEqual(validateOffer({ ...ok, bid: 2 }), [])
  assert.deepEqual(validateOffer({ ...ok, bid: 10 }), [])
  assert.deepEqual(validateOffer({ ...ok, startDate: '2026-12-02', endDate: '2026-12-01' }), ['end_before_start'])
  assert.deepEqual(validateOffer({ ...ok, startDate: '2026-12-01', endDate: '2026-12-01' }), [])
  assert.deepEqual(validateOffer({ ...ok, endDate: '1/12/2026' }), ['bad_date'])
})

test('editing sends the image and translations back unchanged (API overwrites them)', () => {
  const input = toCampaignInput(formFromCampaign(campaign()))
  assert.equal(input.image_url, 'https://img.test/a.webp')
  assert.equal(input.title_ar, 'خصم')
  assert.equal(input.title_en, null)
  assert.equal(input.bid_per_view, 4)
  assert.equal(input.description, null)
})

test('Saudi calendar day, independent of the phone time zone', () => {
  assert.equal(offerToday(new Date('2026-11-20T20:59:00Z')), '2026-11-20')
  assert.equal(offerToday(new Date('2026-11-20T21:00:00Z')), '2026-11-21')
  assert.equal(addDays('2026-12-30', 7), '2027-01-06')
})

test('offer window', () => {
  assert.equal(offerWindowState(null, null, '2026-11-20'), 'live')
  assert.equal(offerWindowState('2026-11-21', null, '2026-11-20'), 'scheduled')
  assert.equal(offerWindowState(null, '2026-11-19', '2026-11-20'), 'ended')
  assert.equal(offerWindowState('2026-11-20', '2026-11-20', '2026-11-20'), 'live')
})

test('helpers', () => {
  assert.equal(clampBid(0), 2)
  assert.equal(clampBid(99), 10)
  assert.equal(runway(25, 4), 6)
  assert.equal(runway(-3, 4), 0)
  assert.equal(actionForReason('no_offer'), 'create')
  assert.equal(actionForReason('switched_off'), 'switch_on')
  assert.equal(actionForReason('ended'), 'edit')
  assert.equal(actionForReason('credits'), 'none')
  const sorted = sortCampaigns([
    campaign({ id: 'old', is_active: false, created_at: '2026-01-01' }),
    campaign({ id: 'new', is_active: false, created_at: '2026-06-01' }),
    campaign({ id: 'on', is_active: true, created_at: '2025-01-01' }),
  ])
  assert.deepEqual(sorted.map((c) => c.id), ['on', 'new', 'old'])
})
