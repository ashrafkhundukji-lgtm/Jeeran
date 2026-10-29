// The offer radii a customer can choose (wallet_members.push_radius_km).
// Shared by the preferences route (validation), the settings section and
// the "widen to X km" empty states, and the Wallet card's empty text, so
// all of them offer the same steps. New members start at 3 km (column
// default, supabase/migrations/20261031_customer_radius_location.sql).
export const RADIUS_OPTIONS_KM = [1, 3, 5, 10] as const

export type RadiusKm = (typeof RADIUS_OPTIONS_KM)[number]

export function isAllowedRadius(value: unknown): value is RadiusKm {
  return typeof value === 'number' && (RADIUS_OPTIONS_KM as readonly number[]).includes(value)
}

// The next wider step, or null when already at (or beyond) the widest.
export function nextRadius(currentKm: number): RadiusKm | null {
  return RADIUS_OPTIONS_KM.find((r) => r > currentKm) ?? null
}
