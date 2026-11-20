import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { createApi, type Api } from '../lib/apiClient'
import { config } from '../lib/config'
import { clearSummaryCache } from '../data/summaryCache'

interface AuthState {
  // undefined while the stored session is being read at startup.
  session: Session | null | undefined
  api: Api
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

async function signOutLocal() {
  await clearSummaryCache().catch(() => {})
  // 'local': this device only, and works offline.
  await supabase.auth.signOut({ scope: 'local' }).catch(() => {})
}

const api = createApi({
  baseUrl: config.apiUrl,
  fetch: (...args) => fetch(...args),
  // getSession() refreshes an expired access token before returning it.
  getAccessToken: async () => (await supabase.auth.getSession()).data.session?.access_token ?? null,
  refreshAccessToken: async () => (await supabase.auth.refreshSession()).data.session?.access_token ?? null,
  onSessionExpired: () => {
    signOutLocal()
  },
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .catch(() => setSession(null))
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => data.subscription.unsubscribe()
  }, [])

  const value = useMemo(() => ({ session, api, signOut: signOutLocal }), [session])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth outside AuthProvider')
  return ctx
}
