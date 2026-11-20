import { NextResponse } from 'next/server'
import { forbidden, redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { isAdminUser as isAdminEmail } from '@/lib/adminEmails'

// Platform admin = a signed-in Supabase user whose CONFIRMED email is listed
// in ADMIN_EMAILS (comma-separated, case-insensitive). Checked on the server
// for every admin API route and admin page. No email lives in the repo, and
// an empty or missing ADMIN_EMAILS means nobody is an admin (fails closed).
//
// Not profiles.role: owners can update their own profiles row through the
// public API (policy "profiles: update own"), so a role column there could
// be self-granted.

export type AdminCheck = { kind: 'admin'; user: User } | { kind: 'anonymous' } | { kind: 'forbidden'; user: User }

export async function checkAdmin(): Promise<AdminCheck> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { kind: 'anonymous' }
  return isAdminEmail(user, process.env.ADMIN_EMAILS) ? { kind: 'admin', user } : { kind: 'forbidden', user }
}

// API routes: 401 not signed in, 403 signed in but not an admin.
export async function requireAdminApi(): Promise<{ ok: true; user: User } | { ok: false; response: NextResponse }> {
  const check = await checkAdmin()
  if (check.kind === 'anonymous') return { ok: false, response: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) }
  if (check.kind === 'forbidden') return { ok: false, response: NextResponse.json({ error: 'Admins only' }, { status: 403 }) }
  return { ok: true, user: check.user }
}

// Admin pages: not signed in → login (back to the page after), signed in
// but not an admin → Next's 403 page.
export async function requireAdminPage(path: string): Promise<User> {
  const check = await checkAdmin()
  if (check.kind === 'anonymous') redirect(`/login?redirect=${encodeURIComponent(path)}`)
  if (check.kind === 'forbidden') forbidden()
  return check.user
}
