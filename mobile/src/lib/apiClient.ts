// HTTP client for the website's owner API. Sends the Supabase access token
// as `Authorization: Bearer`, and on a 401 refreshes the session once and
// retries; a second 401 means the session is gone (signed out elsewhere,
// refresh token revoked) and the caller is told to sign out.
// Pure (fetch and the token source are injected) so it is unit-tested.

export type OfferStatusReason =
  | 'frozen'
  | 'subscription'
  | 'no_offer'
  | 'switched_off'
  | 'not_started'
  | 'ended'
  | 'credits'
  | 'unknown'

export interface Business {
  id: string
  name: string
  category: string
  ad_credits: number
  is_frozen: boolean
  is_subscription_active: boolean
  latitude: number | null
  longitude: number | null
  logo_url: string | null
  phone: string | null
  whatsapp: string | null
}

export interface Campaign {
  id: string
  title: string
  description: string | null
  bid_per_view: number
  is_active: boolean
  start_date: string | null
  end_date: string | null
  image_url: string | null
  title_ar: string | null
  title_en: string | null
  title_ur: string | null
  description_ar: string | null
  description_en: string | null
  description_ur: string | null
  created_at: string
  updated_at: string | null
}

export interface OwnerSummary {
  business: Business
  campaigns: Campaign[]
  offerStatus: { showing: boolean; reason: OfferStatusReason | null; offerId: string | null } | null
  exposure: { exposed: boolean; inGrace: boolean; endsAt: string | null } | null
}

export interface CampaignInput {
  title: string
  description: string | null
  bid_per_view: number
  start_date: string | null
  end_date: string | null
  image_url: string | null
  title_ar: string | null
  title_en: string | null
  title_ur: string | null
  description_ar: string | null
  description_en: string | null
  description_ur: string | null
}

export interface OnboardingInput {
  fullName: string
  businessName: string
  category: string
  latitude: number | null
  longitude: number | null
}

export class ApiError extends Error {
  constructor(
    // 0 = no response (offline, DNS, timeout).
    readonly status: number,
    // The server's own `error` string (English, stable) — mapped to copy by
    // the screens, never shown raw.
    readonly serverError: string,
    readonly code?: string,
  ) {
    super(serverError || `HTTP ${status}`)
  }
  get isNetwork() {
    return this.status === 0
  }
}

export interface ApiDeps {
  baseUrl: string
  fetch: typeof fetch
  getAccessToken: () => Promise<string | null>
  refreshAccessToken: () => Promise<string | null>
  onSessionExpired: () => void
  timeoutMs?: number
}

export function createApi(deps: ApiDeps) {
  const timeoutMs = deps.timeoutMs ?? 15_000

  async function send(method: string, path: string, body: unknown, token: string | null): Promise<Response> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      return await deps.fetch(`${deps.baseUrl}${path}`, {
        method,
        headers: {
          Accept: 'application/json',
          ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      })
    } catch {
      throw new ApiError(0, '')
    } finally {
      clearTimeout(timer)
    }
  }

  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    let token = await deps.getAccessToken()
    if (!token) {
      deps.onSessionExpired()
      throw new ApiError(401, 'Not authenticated')
    }
    let res = await send(method, path, body, token)
    if (res.status === 401) {
      token = await deps.refreshAccessToken().catch(() => null)
      if (token) res = await send(method, path, body, token)
      if (!token || res.status === 401) {
        deps.onSessionExpired()
        throw new ApiError(401, 'Not authenticated')
      }
    }
    const json = (await res.json().catch(() => null)) as Record<string, unknown> | null
    if (!res.ok) {
      throw new ApiError(res.status, typeof json?.error === 'string' ? json.error : '', typeof json?.code === 'string' ? json.code : undefined)
    }
    return json as T
  }

  return {
    summary: () => request<OwnerSummary>('GET', '/api/owner/summary'),
    onboard: (input: OnboardingInput) => request<{ success: true }>('POST', '/api/onboarding', input),
    createCampaign: (input: CampaignInput) => request<{ campaign: Campaign }>('POST', '/api/campaigns', input),
    updateCampaign: (id: string, input: CampaignInput) =>
      request<{ success: true }>('PATCH', `/api/campaigns/${encodeURIComponent(id)}`, input),
    setCampaignActive: (id: string, isActive: boolean) =>
      request<{ success: true }>('PATCH', `/api/campaigns/${encodeURIComponent(id)}`, { is_active: isActive }),
  }
}

export type Api = ReturnType<typeof createApi>
