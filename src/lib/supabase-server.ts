import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Session-scoped client for Server Components / Route Handlers — runs as
// the signed-in user, so RLS enforces "can only touch your own rows"
// instead of relying on manual ownership checks in application code.
export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // Called from a Server Component that can't set cookies —
            // fine as long as middleware is refreshing the session.
          }
        },
      },
    },
  )
}
