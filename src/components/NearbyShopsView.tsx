'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLocale } from '@/lib/i18n/useLocale'
import { getDir } from '@/lib/i18n/locale'
import { NEARBY_SHOPS_COPY } from '@/lib/i18n/nearbyShops'
import { CUSTOMER_UI_COPY } from '@/lib/i18n/customerUi'
import { CATEGORIES, CATEGORY_LABELS } from '@/lib/categories'
import CustomerPage from '@/components/customer/CustomerPage'
import BottomNav, { NAV_CLEARANCE } from '@/components/customer/BottomNav'
import SearchField from '@/components/customer/SearchField'
import CategoryChips from '@/components/customer/CategoryChips'
import { ChevronForwardIcon, SearchIcon, StoreIcon } from '@/components/customer/icons'
import { DiscountBadge, DistanceText, PRESS, ShopAvatar } from '@/components/customer/primitives'
import { EmptyState, ErrorState, InviteShopButton } from '@/components/customer/States'
import type { NearbyBusiness } from '@/lib/wallet/nearby-businesses'

// Chip row + always-visible flat list, same shape as NearbyOffersView.tsx
// (src/app/offers/nearby) — see that file's header comment for why this
// replaced the earlier category-grid-then-drill-down flow. Covers EVERY
// nearby shop instead of only ones with an active offer — see
// nearby_businesses() (supabase/migrations/20260829b_nearby_businesses.sql).
// Each row routes to /offers/[campaignId] when the shop has one live, same
// destination the Wallet card's own "View offer" links use; otherwise it's
// a plain Directions link — still a useful tap, just not an offer page
// that doesn't exist for that shop.
//
// Typing in the search box (with a member token) searches EVERY shop on
// Jeeran, not just the nearby list above — see /api/wallet/search. Results
// are split into "Nearby" (within the member's own radius) and "Farther
// away" so a far match is clearly labeled as such. Until the server answers
// (or with no token) the box falls back to filtering the nearby list
// locally, so typing never shows a blank screen. `initialQuery` is how the
// search bar on Home hands its query over (?q= on this page's URL).
//
// The "Near me | Everywhere" switch is for browsing without typing anything:
// "Everywhere" loads every shop on Jeeran (same endpoint, `all=1`), nearest
// first, split into the same Nearby / Farther away sections. Home's
// "All shops · near & far" card opens this page with it pre-set
// (`initialScope`, from ?scope=all).
//
// Visual language (docs/design-reference/): rows lead with the shop itself
// (avatar, name, category, distance), and show the live offer's title with
// its discount badge — or a muted "no offer right now" — so this list no
// longer looks like the Offers tab.
const SEARCH_MIN_LENGTH = 2
const SEARCH_DEBOUNCE_MS = 300

type RemoteSearch = { query: string; results: NearbyBusiness[]; radiusKm: number }

export default function NearbyShopsView({
  shops,
  token,
  initialQuery = '',
  initialScope = 'near',
}: {
  shops: NearbyBusiness[]
  token?: string
  initialQuery?: string
  initialScope?: 'near' | 'all'
}) {
  const [locale] = useLocale()
  const copy = NEARBY_SHOPS_COPY[locale]
  const ui = CUSTOMER_UI_COPY[locale]
  const dir = getDir(locale)
  const [search, setSearch] = useState(initialQuery)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null) // null = "All"
  const [remote, setRemote] = useState<RemoteSearch | null>(null)
  const [scope, setScope] = useState<'near' | 'all'>(token ? initialScope : 'near')
  const [allShops, setAllShops] = useState<Omit<RemoteSearch, 'query'> | null>(null)
  const [allError, setAllError] = useState(false)

  useEffect(() => {
    if (!token || scope !== 'all' || allShops || allError) return
    const controller = new AbortController()
    fetch(`/api/wallet/search?token=${encodeURIComponent(token)}&all=1`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { results: NearbyBusiness[]; radiusKm: number } | null) => {
        if (body) setAllShops({ results: body.results, radiusKm: body.radiusKm })
        else setAllError(true)
      })
      .catch(() => {
        // Aborted (navigated away) or offline — offline gets the retry card.
        if (!controller.signal.aborted) setAllError(true)
      })
    return () => controller.abort()
  }, [token, scope, allShops, allError])

  const everywhere = scope === 'all' ? allShops : null
  const loadingEverywhere = scope === 'all' && !allShops && !allError
  const baseShops = everywhere?.results ?? shops

  const query = search.trim().toLowerCase()
  const searchEverywhere = !!token && query.length >= SEARCH_MIN_LENGTH

  useEffect(() => {
    if (!token || !searchEverywhere) return
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/wallet/search?token=${encodeURIComponent(token)}&q=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        )
        if (!res.ok) return
        const body = (await res.json()) as { results: NearbyBusiness[]; radiusKm: number }
        setRemote({ query, results: body.results, radiusKm: body.radiusKm })
      } catch {
        // Aborted (customer kept typing) or offline — the local filter below
        // is still showing, which is the best fallback available.
      }
    }, SEARCH_DEBOUNCE_MS)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [searchEverywhere, token, query])

  // Only trust server results for the query currently in the box — a stale
  // answer for "piz" shouldn't linger once the customer has typed "pizza".
  const remoteResults = searchEverywhere && remote?.query === query ? remote : null
  // Whichever server list is on screen carries the member's radius, which is
  // what the Nearby / Farther away split needs.
  const sectioned = remoteResults ?? everywhere

  const presentCategories = useMemo(() => {
    const present = new Set((remoteResults?.results ?? baseShops).map((s) => s.category))
    return CATEGORIES.filter((c) => present.has(c))
  }, [baseShops, remoteResults])

  const visibleShops = useMemo(() => {
    if (remoteResults) {
      return remoteResults.results.filter((s) => !selectedCategory || s.category === selectedCategory)
    }
    return baseShops.filter((s) => {
      if (selectedCategory && s.category !== selectedCategory) return false
      if (!query) return true
      const categoryLabel = CATEGORY_LABELS[locale][s.category] ?? s.category
      return s.business_name.toLowerCase().includes(query) || categoryLabel.toLowerCase().includes(query)
    })
  }, [baseShops, remoteResults, query, selectedCategory, locale])

  const nearbyResults = sectioned ? visibleShops.filter((s) => s.distance_km <= sectioned.radiusKm) : []
  const fartherResults = sectioned ? visibleShops.filter((s) => s.distance_km > sectioned.radiusKm) : []

  const renderShop = (s: NearbyBusiness) => {
    const href = s.has_active_offer
      ? token
        ? `/offers/${s.top_offer_id}?token=${encodeURIComponent(token)}`
        : `/offers/${s.top_offer_id}`
      : `https://www.google.com/maps/dir/?api=1&destination=${s.business_lat},${s.business_lng}`
    const categoryLabel = CATEGORY_LABELS[locale][s.category] ?? s.category

    return (
      <a
        key={s.business_id}
        href={href}
        className={`flex items-center gap-3 rounded-[18px] border border-brand-line bg-white p-3.5 ${PRESS}`}
      >
        <ShopAvatar name={s.business_name} size={48} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="min-w-0 text-start text-[15px] font-bold text-brand-navy-deep">
            <bdi className="inline-block max-w-full truncate align-bottom">{s.business_name}</bdi>
          </span>
          <span className="text-[12.5px] text-brand-muted">
            {categoryLabel} · <DistanceText km={s.distance_km} locale={locale} />
          </span>
          {s.has_active_offer && s.top_offer_title ? (
            <span className="flex min-w-0 items-center gap-1.5">
              <DiscountBadge title={s.top_offer_title} locale={locale} className="flex-none" />
              <span className="min-w-0 text-start text-[13px] font-semibold text-brand-coral">
                <bdi className="inline-block max-w-full truncate align-bottom">{s.top_offer_title}</bdi>
              </span>
            </span>
          ) : (
            <span className="text-[13px] text-brand-muted">{ui.shops.noOfferNow}</span>
          )}
        </div>
        <ChevronForwardIcon size={20} strokeWidth={2.2} className="flex-none text-brand-muted" />
      </a>
    )
  }

  const sectionLabel = (label: string) => (
    <h2 className="mt-2 font-display text-[15px] font-semibold text-brand-navy-deep">{label}</h2>
  )

  return (
    <CustomerPage dir={dir} lang={locale} clearance={token ? NAV_CLEARANCE : 'pb-10'}>
      <div className="flex flex-col gap-3.5 px-6 pt-6">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-[28px] leading-[1.25] font-bold text-brand-navy-deep">{copy.heading}</h1>
          <p className="text-[15px] text-brand-muted">{copy.subheading}</p>
        </div>

        {token && (
          <div role="tablist" aria-label={copy.scopeLabel} className="flex rounded-2xl border border-brand-line bg-white p-1">
            {(['near', 'all'] as const).map((s) => (
              <button
                key={s}
                type="button"
                role="tab"
                aria-selected={scope === s}
                onClick={() => {
                  setScope(s)
                  setSelectedCategory(null)
                  setAllError(false)
                }}
                className={`h-11 flex-1 rounded-xl text-sm font-semibold transition-colors ${
                  scope === s ? 'bg-brand-navy text-white' : 'text-brand-muted'
                }`}
              >
                {s === 'near' ? copy.scopeNear : copy.scopeAll}
              </button>
            ))}
          </div>
        )}

        {(shops.length > 0 || token) && (
          <>
            <SearchField
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              label={ui.home.searchLabel}
              placeholder={token ? copy.searchEverywherePlaceholder : copy.searchPlaceholder}
            />
            {presentCategories.length > 1 && (
              <CategoryChips
                categories={presentCategories}
                selected={selectedCategory}
                onSelect={setSelectedCategory}
                allLabel={copy.allCategories}
                locale={locale}
              />
            )}
          </>
        )}

        {allError && scope === 'all' && !remoteResults ? (
          <ErrorState locale={locale} onRetry={() => setAllError(false)} />
        ) : loadingEverywhere && !remoteResults ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} aria-hidden="true" className="flex items-center gap-3 rounded-[18px] border border-brand-line bg-white p-3.5">
                <div className="skeleton h-12 w-12 flex-none rounded-full" />
                <div className="flex flex-1 flex-col gap-2">
                  <div className="skeleton h-4 w-1/2 rounded-full" />
                  <div className="skeleton h-3 w-1/3 rounded-full" />
                </div>
              </div>
            ))}
            <span className="sr-only">{copy.loadingAll}</span>
          </div>
        ) : baseShops.length === 0 && !query ? (
          <EmptyState icon={<StoreIcon size={28} />} title={copy.empty} action={<InviteShopButton locale={locale} />} />
        ) : sectioned && visibleShops.length > 0 ? (
          <div className="flex flex-col gap-3">
            {nearbyResults.length > 0 && sectionLabel(copy.nearbySection)}
            {nearbyResults.map(renderShop)}
            {fartherResults.length > 0 && sectionLabel(copy.fartherSection)}
            {fartherResults.map(renderShop)}
          </div>
        ) : visibleShops.length > 0 ? (
          <div className="flex flex-col gap-3">{visibleShops.map(renderShop)}</div>
        ) : (
          <EmptyState
            icon={<SearchIcon size={28} />}
            title={searchEverywhere && !remoteResults ? copy.searching : copy.emptySearch}
          />
        )}
      </div>

      {token && <BottomNav token={token} active="shops" />}
    </CustomerPage>
  )
}
