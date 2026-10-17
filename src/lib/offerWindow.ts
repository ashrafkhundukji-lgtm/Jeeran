// The app-side twin of offer_in_date_window() / jeeran_today() in
// supabase/migrations/20261017b_offer_date_window.sql: an offer's
// start_date/end_date are calendar days in Saudi time, inclusive, NULL = open.
// Keep the two in sync.
export const OFFER_TIME_ZONE = 'Asia/Riyadh'

export function offerToday(now: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', { timeZone: OFFER_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}

export type OfferWindowState = 'live' | 'scheduled' | 'ended'

export function offerWindowState(startDate: string | null, endDate: string | null, today = offerToday()): OfferWindowState {
  if (startDate && startDate > today) return 'scheduled'
  if (endDate && endDate < today) return 'ended'
  return 'live'
}
