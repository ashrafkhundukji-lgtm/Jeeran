// Pure part of the admin check (unit-tested without Next): ADMIN_EMAILS is a
// comma-separated list; matching is case-insensitive and only counts a
// CONFIRMED email, so signing up with an admin's address (unconfirmed)
// never grants admin.
export function parseAdminEmails(raw: string | undefined): Set<string> {
  return new Set(
    (raw ?? '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter((e) => /^[^@\s]+@[^@\s]+$/.test(e)),
  )
}

export function isAdminUser(user: { email?: string | null; email_confirmed_at?: string | null } | null, raw: string | undefined): boolean {
  if (!user?.email || !user.email_confirmed_at) return false
  return parseAdminEmails(raw).has(user.email.trim().toLowerCase())
}
