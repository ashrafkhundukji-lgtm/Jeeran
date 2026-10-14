import type { Locale } from './i18n/locale'

// Small, pure display helpers for the customer screens. Nothing here
// changes data or ranking — it only decides how an already-fetched value is
// shown. Numbers stay Western digits (matches current behavior); the
// components that render these wrap the number in <bdi dir="ltr"> so it
// never reorders inside an RTL sentence.

const DISTANCE_UNITS: Record<Locale, { m: string; km: string }> = {
  ar: { m: 'م', km: 'كم' },
  en: { m: 'm', km: 'km' },
  ur: { m: 'میٹر', km: 'کلومیٹر' },
}

// Under 1 km → whole meters, rounded to the nearest 10 ("100 m"), so
// "0.1 km" never shows; otherwise one decimal ("1.2 km").
export function formatDistance(km: number, locale: Locale): { value: string; unit: string } {
  const units = DISTANCE_UNITS[locale]
  const meters = Math.max(10, Math.round((km * 1000) / 10) * 10)
  if (meters < 1000) return { value: String(meters), unit: units.m }
  return { value: km.toFixed(1), unit: units.km }
}

// Great-circle distance in km — only for pages that already have both
// points (the offer page with a member token, the scan page's host shop).
export function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(bLat - aLat)
  const dLng = toRad(bLng - aLng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(h))
}

export type Badge = { kind: 'percent'; value: number } | { kind: 'bundle'; buy: number; get: number } | { kind: 'free' }

const EASTERN_DIGITS = /[٠-٩۰-۹]/g
function toWesternDigits(s: string): string {
  return s.replace(EASTERN_DIGITS, (d) => {
    const code = d.charCodeAt(0)
    return String(code >= 0x06f0 ? code - 0x06f0 : code - 0x0660)
  })
}

const WORD_NUMBERS: Record<string, number> = { one: 1, a: 1, an: 1, another: 1, two: 2, three: 3, four: 4, five: 5 }
const toNumber = (s: string | undefined) => (s == null ? NaN : /^\d+$/.test(s) ? Number(s) : (WORD_NUMBERS[s.toLowerCase()] ?? NaN))

// Conservative badge from the offer title only — no new column (see the
// "Open decisions" note in the refresh brief). Returns null whenever it
// isn't sure, and the UI then shows no badge at all rather than a guess.
//   "20% Off Any Haircut" / "خصم 20% …"            → 20%
//   "Buy 1 Get 1 Free …" / "Buy 3, Get 1 Free"     → 1+1 / 3+1
//   "اشترِ 3 قطع واحصل على الرابعة مجانًا"          → 3+1
//   "اشترِ لاتيه واحصل على الثاني مجانًا"           → 1+1
//   "Free Tire Check …" / "فحص مجاني …"            → Free
export function deriveBadge(title: string): Badge | null {
  const t = toWesternDigits(title).trim()
  if (!t) return null

  const percents = [...t.matchAll(/(\d{1,3})\s?[%٪]/g)].map((m) => Number(m[1]))
  const distinct = [...new Set(percents)]
  if (distinct.length === 1 && distinct[0] > 0 && distinct[0] < 100) {
    return { kind: 'percent', value: distinct[0] }
  }
  if (distinct.length > 1) return null // "10% or 20%" — ambiguous, show nothing

  const en = t.match(/\bbuy\s+(\d+|one|two|three|four|five|a|an)\b[^.]*?\bget\s+(\d+|one|two|three|a|an|another)?\b[^.]*?\bfree\b/i)
  if (en) {
    const buy = toNumber(en[1])
    const get = en[2] ? toNumber(en[2]) : 1
    if (buy >= 1 && buy <= 10 && get >= 1 && get <= 5) return { kind: 'bundle', buy, get }
    return null
  }

  if (/اشتر/.test(t) && /(احصل|واحصل)/.test(t) && /مجان/.test(t)) {
    const buyDigits = t.match(/اشتر[ِيَ]?\s+(\d+)/)
    if (buyDigits) {
      const buy = Number(buyDigits[1])
      if (buy >= 1 && buy <= 10) return { kind: 'bundle', buy, get: 1 }
      return null
    }
    // No digit: only the unambiguous "…get the second free" phrasing.
    if (/(الثاني|الثانية)/.test(t)) return { kind: 'bundle', buy: 1, get: 1 }
    return null
  }

  if (/\bfree\b/i.test(t) || /مجان/.test(t) || /مفت/.test(t)) return { kind: 'free' }
  return null
}

export function badgeText(badge: Badge, freeLabel: string): string {
  if (badge.kind === 'percent') return `${badge.value}%`
  if (badge.kind === 'bundle') return `${badge.buy}+${badge.get}`
  return freeLabel
}

// Today's date in the market's own timezone, as YYYY-MM-DD — campaigns.end_date
// is a plain date with no timezone, entered by Saudi shops.
const MARKET_TZ = 'Asia/Riyadh'
function todayInMarket(now: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: MARKET_TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}

// Days until an offer's end_date: 0 = ends today, 1–3 = ends soon, otherwise
// null (no chip). Past dates also return null — those offers aren't active.
export function daysUntilEnd(endDate: string | null | undefined, now: Date = new Date()): number | null {
  if (!endDate) return null
  const today = Date.parse(`${todayInMarket(now)}T00:00:00Z`)
  const end = Date.parse(`${endDate.slice(0, 10)}T00:00:00Z`)
  if (Number.isNaN(end)) return null
  const days = Math.round((end - today) / 86_400_000)
  return days >= 0 && days <= 3 ? days : null
}
