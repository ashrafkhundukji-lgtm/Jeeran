import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { bearerTokenFrom } from '@/lib/bearerToken'

// One place that turns a request into "who is this, and a Supabase client
// that acts as them". Two ways in:
//
// - Cookie session (the website): unchanged, createSupabaseServerClient().
// - `Authorization: Bearer <access token>` (the native owner app, which has
//   no cookies). The token is verified by Supabase Auth itself
//   (auth.getUser(token) is a round trip to the Auth server, which checks
//   the signature, expiry and that the session still exists); it is never
//   just decoded. The returned client sends the same token to PostgREST, so
//   RLS applies to the app exactly as it does to the cookie session.
//
// Routes then run their usual owner checks on `user` and `supabase`. Nothing
// here grants more than the cookie session would. A request that sends an
// Authorization header never falls back to cookies: a bad or expired token
// is a 401, even if a cookie is also present.
//
// Only routes the owner app needs call this; every other route keeps
// createSupabaseServerClient() and ignores the header.

export interface RequestAuth {
  supabase: SupabaseClient
  user: User | null
  via: 'bearer' | 'cookie'
}

const NO_SESSION = { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }

function anonClient(token?: string): SupabaseClient {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    ...(token ? { global: { headers: { Authorization: `Bearer ${token}` } } } : {}),
    auth: NO_SESSION,
  })
}

export async function getRequestAuth(req: Request): Promise<RequestAuth> {
  const token = bearerTokenFrom(req.headers.get('authorization'))

  if (token === null) {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return { supabase, user, via: 'cookie' }
  }

  // A malformed header or a token Supabase rejects: no identity, and an
  // anonymous client (anon key only), so even a route that forgot to check
  // `user` could not act as anyone.
  if (token === 'invalid') return { supabase: anonClient(), user: null, via: 'bearer' }

  const supabase = anonClient(token)
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return { supabase: anonClient(), user: null, via: 'bearer' }
  return { supabase, user: data.user, via: 'bearer' }
}
