'use client'

import { useLocale } from '@/lib/i18n/useLocale'
import { getDir, type Locale } from '@/lib/i18n/locale'
import { OFFER_PAGE_COPY } from '@/lib/i18n/offers'
import { CATEGORY_LABELS } from '@/lib/categories'

// Same brand tokens as LandingPage.tsx: #FBFCFD canvas, #1a1a1a ink,
// Archivo for display type, #FF6B4A accent.
const ARCHIVO = 'font-[family-name:var(--font-archivo)]'

// Split from the server page.tsx (src/app/offers/[campaignId]/page.tsx)
// purely because useLocale() (localStorage-backed) is client-only — same
// ProfileView/ProfileForm split already used for the dashboard. All data
// (campaign/business/derived URLs) is fetched server-side and passed down
// as plain props; this component only owns locale state and rendering.
// Offer title/description/business name are NEVER run through the locale
// copy — that's whatever the shop typed, in whatever language, same
// reasoning already established for the Wallet card and everywhere else in
// this app.
//
// Deliberately the one wallet-linked screen with NO WalletTabBar — this is
// a drill-in from Home/Offers/Shops (or the Wallet card's own "View offer"
// links), not a top-level destination of its own. A floating back button
// over the hero (native app convention: Instagram/Airbnb-style) replaces
// it instead — see handleBack() below for why it isn't a plain
// history.back().
export default function OfferPageView({
  isActive,
  imageUrl,
  businessName,
  category,
  content,
  directionsUrl,
  whatsappUrl,
  callUrl,
  token,
}: {
  isActive: boolean
  imageUrl: string | null
  businessName: string
  category: string
  // Pre-resolved per-locale title/description — see the fallback chain
  // (shop translation > fresh auto-translation cache > original text)
  // documented in the server page.tsx. Resolved server-side because locale
  // itself is only known client-side (useLocale is localStorage-backed).
  content: Record<Locale, { title: string; description: string | null }>
  directionsUrl: string | null
  whatsappUrl: string | null
  callUrl: string | null
  // Optional: present when reached via the Wallet card's own "View offer"
  // link or from a same-site list (NearbyOffersView/NearbyShopsView), which
  // now carry it forward — absent for a link forwarded without it, or an
  // older Wallet pass that hasn't re-patched since this existed. Used only
  // by handleBack()'s no-history fallback below.
  token?: string
}) {
  const [locale] = useLocale()
  const copy = OFFER_PAGE_COPY[locale]
  const dir = getDir(locale)
  const categoryLabel = CATEGORY_LABELS[locale][category] ?? category
  const { title, description } = content[locale]

  // A real prior page in THIS tab's history (came from Home/Offers/Shops,
  // or a search result) → go back to it, same as anywhere else in the app.
  // No such history (opened fresh from the Wallet card's own link, a
  // different browser tab, or a forwarded URL) → history.back() would be a
  // silent no-op, stranding the customer on a screen with no other way
  // out now that this page has no tab bar. Falling back to the Home tab
  // (when a token is present) is the same "return to the app's root
  // instead of doing nothing" convention native apps use for an empty back
  // stack.
  function handleBack() {
    try {
      if (document.referrer && new URL(document.referrer).origin === window.location.origin) {
        window.history.back()
        return
      }
    } catch {
      // fall through to the token-based fallback below
    }
    if (token) {
      window.location.href = `/wallet/home?token=${encodeURIComponent(token)}`
    } else {
      window.history.back()
    }
  }

  return (
    <main dir={dir} className="min-h-screen bg-[#FBFCFD] pb-28 text-[#1a1a1a]">
      {/* Hero — floating back button sits over it, native app style, rather
          than a separate top header row this page no longer has. */}
      <div className="relative aspect-[16/10] w-full">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1E3A8A] to-[#3B5BC4]">
            <span className={`${ARCHIVO} px-8 text-center text-3xl font-black text-white/90`}>{businessName}</span>
          </div>
        )}
        <button
          type="button"
          onClick={handleBack}
          aria-label={copy.back}
          className={`absolute top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#1a1a1a] shadow-[0_4px_12px_rgba(0,0,0,0.15)] ${dir === 'rtl' ? 'right-4' : 'left-4'}`}
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
            className={dir === 'rtl' ? 'scale-x-[-1]' : ''}
          >
            <path d="M10 3.5L5.5 8L10 12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="mx-auto max-w-[720px] px-6 pt-6 sm:px-8">
        {!isActive && (
          <div className="mb-6 rounded-xl border border-neutral-200 bg-white px-5 py-4 text-sm text-[#5a5a5a]">
            {copy.inactiveNotice(businessName)}
          </div>
        )}

        <p className="mb-2 text-xs font-medium tracking-wide text-[#6b6b6b] uppercase">{categoryLabel}</p>
        <h1 className={`${ARCHIVO} mb-2 text-[28px] font-black leading-[1.05] tracking-[-0.01em] sm:text-[34px]`}>
          {title}
        </h1>
        <p className="mb-6 text-[15px] font-medium text-[#1E3A8A]">{copy.atBusiness(businessName)}</p>

        {description && (
          <p className="mb-8 max-w-[560px] text-[17px] leading-[1.6] text-[#5a5a5a]">{description}</p>
        )}

        <div className="rounded-2xl border border-[#FF6B4A]/25 bg-[#FFF7F3] px-6 py-5">
          <div className="mb-1 h-1.5 w-10 rounded-full bg-[#FF6B4A]" />
          <p className="text-[15px] font-semibold text-[#1a1a1a]">{copy.howToRedeem}</p>
          <p className="text-sm leading-relaxed text-[#5a5a5a]">{copy.redeemBody(businessName)}</p>
        </div>
      </div>

      {/* Sticky bottom action bar — was inline flex-wrap buttons in the
          content flow; a fixed row is the native pattern (matches the
          Redeem/Directions/Call action bar in the mobile redesign), and
          keeps these one thumb-reach away regardless of scroll position. */}
      {(directionsUrl || whatsappUrl || callUrl) && (
        <div
          className="fixed inset-x-0 bottom-0 z-20 flex gap-2 border-t border-neutral-200 bg-white px-4 py-3"
          style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
        >
          {directionsUrl && (
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 flex-col items-center gap-1 rounded-2xl bg-[#1E3A8A] py-2.5 text-white transition-colors hover:bg-[#16306e]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 11l18-8-8 18-2-8-8-2Z" />
              </svg>
              <span className="text-xs font-semibold">{copy.getDirections}</span>
            </a>
          )}
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 flex-col items-center gap-1 rounded-2xl border border-[#25D366]/40 bg-[#25D366]/10 py-2.5 text-[#128C4A] transition-colors hover:bg-[#25D366]/20"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 11.5a8.38 8.38 0 0 1-3.8 7 8.5 8.5 0 0 1-8.9.3L3 20l1.2-5.3a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 12.3-7.6 8.4 8.4 0 0 1 5.4 8.2Z" />
              </svg>
              <span className="text-xs font-semibold">{copy.whatsapp}</span>
            </a>
          )}
          {callUrl && (
            <a
              href={callUrl}
              className="flex flex-1 flex-col items-center gap-1 rounded-2xl border border-neutral-200 bg-white py-2.5 text-[#1a1a1a] transition-colors hover:bg-neutral-50"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
              </svg>
              <span className="text-xs font-semibold">{copy.call}</span>
            </a>
          )}
        </div>
      )}
    </main>
  )
}
