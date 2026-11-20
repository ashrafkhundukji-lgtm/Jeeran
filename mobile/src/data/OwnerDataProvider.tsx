import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { ApiError, type CampaignInput, type OwnerSummary } from '../lib/apiClient'
import { loadSummary, saveSummary } from './summaryCache'

// One source of truth for the signed-in owner's shop and offers, shared by
// every tab. Screens never call the summary endpoint themselves; they call
// refresh() and read from here, and mutations refresh it afterwards.

export type LoadState =
  | { kind: 'loading' }
  | { kind: 'needs_onboarding' }
  | { kind: 'error'; error: ApiError }
  | { kind: 'ready' }

interface OwnerData {
  state: LoadState
  summary: OwnerSummary | null
  // Set when `summary` came from the device cache because the network failed.
  offlineSince: string | null
  // A refresh that failed while older data is still on screen.
  refreshError: ApiError | null
  refreshing: boolean
  refresh: () => Promise<void>
  setActive: (id: string, active: boolean) => Promise<void>
  createCampaign: (input: CampaignInput) => Promise<void>
  updateCampaign: (id: string, input: CampaignInput) => Promise<void>
}

const OwnerDataContext = createContext<OwnerData | null>(null)

export function OwnerDataProvider({ children }: { children: ReactNode }) {
  const { api, session } = useAuth()
  const userId = session?.user.id ?? null
  const [state, setState] = useState<LoadState>({ kind: 'loading' })
  const [summary, setSummary] = useState<OwnerSummary | null>(null)
  const [offlineSince, setOfflineSince] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState<ApiError | null>(null)
  const inFlight = useRef<Promise<void> | null>(null)

  const refresh = useCallback(async () => {
    if (!userId) return
    if (inFlight.current) return inFlight.current
    const run = (async () => {
      setRefreshing(true)
      try {
        const next = await api.summary()
        setSummary(next)
        setOfflineSince(null)
        setRefreshError(null)
        setState({ kind: 'ready' })
        saveSummary(userId, next).catch(() => {})
      } catch (e) {
        const err = e instanceof ApiError ? e : new ApiError(0, '')
        if (err.status === 404 && err.code === 'no_business') {
          setSummary(null)
          setState({ kind: 'needs_onboarding' })
        } else if (err.isNetwork) {
          const cached = await loadSummary(userId).catch(() => null)
          if (cached) {
            setSummary(cached.summary)
            setOfflineSince(cached.savedAt)
            setState({ kind: 'ready' })
          } else {
            setState((s) => (s.kind === 'ready' ? s : { kind: 'error', error: err }))
          }
        } else if (err.status !== 401) {
          // 401 signs out (AuthProvider); anything else is shown.
          setRefreshError(err)
          setState((s) => (s.kind === 'ready' ? s : { kind: 'error', error: err }))
        }
      } finally {
        setRefreshing(false)
        inFlight.current = null
      }
    })()
    inFlight.current = run
    return run
  }, [api, userId])

  // First load. The provider is keyed by user id ((owner)/_layout.tsx), so
  // a different account always starts from a fresh, empty state.
  useEffect(() => {
    refresh()
  }, [refresh])

  const setActive = useCallback(
    async (id: string, active: boolean) => {
      // Optimistic, rolled back on failure (same as the website's toggle).
      setSummary((s) => s && { ...s, campaigns: s.campaigns.map((c) => (c.id === id ? { ...c, is_active: active } : c)) })
      try {
        await api.setCampaignActive(id, active)
      } catch (e) {
        setSummary((s) => s && { ...s, campaigns: s.campaigns.map((c) => (c.id === id ? { ...c, is_active: !active } : c)) })
        throw e
      }
      await refresh()
    },
    [api, refresh],
  )

  const createCampaign = useCallback(
    async (input: CampaignInput) => {
      await api.createCampaign(input)
      await refresh()
    },
    [api, refresh],
  )

  const updateCampaign = useCallback(
    async (id: string, input: CampaignInput) => {
      await api.updateCampaign(id, input)
      await refresh()
    },
    [api, refresh],
  )

  const value = useMemo(
    () => ({ state, summary, offlineSince, refreshError, refreshing, refresh, setActive, createCampaign, updateCampaign }),
    [state, summary, offlineSince, refreshError, refreshing, refresh, setActive, createCampaign, updateCampaign],
  )
  return <OwnerDataContext.Provider value={value}>{children}</OwnerDataContext.Provider>
}

export function useOwnerData(): OwnerData {
  const ctx = useContext(OwnerDataContext)
  if (!ctx) throw new Error('useOwnerData outside OwnerDataProvider')
  return ctx
}
