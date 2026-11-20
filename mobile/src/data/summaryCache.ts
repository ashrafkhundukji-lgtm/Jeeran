import { secureStorage } from '../lib/storage'
import type { OwnerSummary } from '../lib/apiClient'

// Last good owner summary, so Home and Offers still open offline. Keyed by
// user id so a different account on the same phone never sees it; cleared
// on sign-out.
const KEY = 'owner-summary'
const MAX_CAMPAIGNS = 20

interface Cached {
  userId: string
  savedAt: string
  summary: OwnerSummary
}

export async function saveSummary(userId: string, summary: OwnerSummary): Promise<void> {
  const trimmed = { ...summary, campaigns: summary.campaigns.slice(0, MAX_CAMPAIGNS) }
  const value: Cached = { userId, savedAt: new Date().toISOString(), summary: trimmed }
  await secureStorage.setItem(KEY, JSON.stringify(value))
}

export async function loadSummary(userId: string): Promise<{ summary: OwnerSummary; savedAt: string } | null> {
  const raw = await secureStorage.getItem(KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Cached
    return parsed.userId === userId ? { summary: parsed.summary, savedAt: parsed.savedAt } : null
  } catch {
    return null
  }
}

export async function clearSummaryCache(): Promise<void> {
  await secureStorage.removeItem(KEY)
}
