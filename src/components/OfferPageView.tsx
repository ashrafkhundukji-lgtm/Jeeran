'use client'

import { useLocale } from '@/lib/i18n/useLocale'
import { getDir, type Locale } from '@/lib/i18n/locale'
import { displayFont } from '@/lib/i18n/displayFont'
import { OFFER_PAGE_COPY } from '@/lib/i18n/offers'
import { CATEGORY_LABELS } from '@/lib/categories'
import WalletTabBar from '@/components/WalletTabBar'

// Same brand tokens as LandingPage.tsx: #FFF8EC canvas, #2E1065 ink,
// Archivo for display type, #FF5A79 accent. This one constant stays plain
// ARCHIVO (not displayFont) — it wraps the image-fallback business-name
// span, which is shop-typed content, not locale-driven copy.
const ARCHIVO = 'font-[family-name:var(--font-baloo)]'

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
// This IS now on WalletTabBar (a real customer got stuck here with no way
// back to the rest of the site — a Wallet card's "View offer" tap lands
// here directly, often with no in-app history behind it, and this used to
// be the one wallet-linked screen with no tab bar of its own). Kept the
// floating back button over the hero too (native app convention:
// Instagram/Airbnb-style) since it's still the fastest way back to
// whichever list this was opened from — see handleBack() below for why it
// isn't a plain history.back(). Tab bar (and its "offers" highlight) only
// renders when a token is present, same conditional as every other
// wallet-linked page — a shared/forwarded link, or a preview from
// BrowseView/OwnerDashboardView, has no member to scope it to.
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
  // silent no-op. WalletTabBar below now covers the no-token-mismatch case
  // where that would otherwise strand the customer, but falling back to the
  // Home tab here (when a token is present) still gets them there in one
  // tap instead of two, the same "return to the app's root instead of doing
  // nothing" convention native apps use for an empty back stack.
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

  const actionRow = (directionsUrl || whatsappUrl || callUrl) ? (
    <>
      {directionsUrl && (
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 flex-col items-center gap-1 rounded-2xl bg-[#2E1065] py-2.5 text-white transition-colors hover:bg-[#16306e]"
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
          className="flex flex-1 flex-col items-center gap-1 rounded-2xl border border-[#EDE3F7] bg-white py-2.5 text-[#2E1065] transition-colors hover:bg-neutral-50"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
          </svg>
          <span className="text-xs font-semibold">{copy.call}</span>
        </a>
      )}
    </>
  ) : null

  const bottomPad = token ? (actionRow ? 'pb-44' : 'pb-24') : 'pb-28'

  return (
    <main dir={dir} className={`min-h-screen bg-[#FFF8EC] ${bottomPad} text-[#2E1065]`}>
      {/* Hero — floating back button sits over it, native app style, rather
          than a separate top header row this page no longer has. */}
      <div className="relative aspect-[16/10] w-full">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#2E1065] to-[#4C2A98]">
            <span className={`${ARCHIVO} px-8 text-center text-3xl font-black text-white/90`}>{businessName}</span>
          </div>
        )}
        <button
          type="button"
          onClick={handleBack}
          aria-label={copy.back}
          className={`absolute top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#2E1065] shadow-[0_4px_12px_rgba(0,0,0,0.15)] ${dir === 'rtl' ? 'right-4' : 'left-4'}`}
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
          <div className="mb-6 rounded-xl border border-[#EDE3F7] bg-white px-5 py-4 text-sm text-[#6B5A8C]">
            {copy.inactiveNotice(businessName)}
          </div>
        )}

        <p className="mb-2 text-xs font-medium tracking-wide text-[#6B5A8C] uppercase">{categoryLabel}</p>
        {/* title is locale-driven (shop translation > auto-translation cache
            > original — see the server page.tsx), unlike businessName above,
            so it needs the real Arabic display face, not plain ARCHIVO. */}
        <h1 className={`${displayFont(locale)} mb-2 text-[28px] font-black leading-[1.05] tracking-[-0.01em] sm:text-[34px]`}>
          {title}
        </h1>
        <p className="mb-6 text-[15px] font-medium text-[#2E1065]">{copy.atBusiness(businessName)}</p>

        {description && (
          <p className="mb-8 max-w-[560px] text-[17px] leading-[1.6] text-[#6B5A8C]">{description}</p>
        )}

        <div className="rounded-2xl border border-[#FF5A79]/25 bg-[#FFF7F3] px-6 py-5">
          <div className="mb-1 h-1.5 w-10 rounded-full bg-[#FF5A79]" />
          <p className="text-[15px] font-semibold text-[#2E1065]">{copy.howToRedeem}</p>
          <p className="text-sm leading-relaxed text-[#6B5A8C]">{copy.redeemBody(businessName)}</p>
        </div>
      </div>

      {/* Directions/WhatsApp/Call: one thumb-reach away regardless of scroll
          position, same as the rest of the mobile redesign. With a token
          (came from the wallet mini-site) it rides inside WalletTabBar as a
          floating card above the pill nav, so this page doesn't fight the
          tab bar for the same fixed footer. Without one (a shared link, or
          a preview from BrowseView/OwnerDashboardView with no member to tie
          a tab bar to) it's its own edge-to-edge sticky bar, same as
          before. */}
      {token ? (
        <WalletTabBar token={token} active="offers">
          {actionRow && (
            <div className="flex gap-2 rounded-2xl border border-[#EDE3F7] bg-white p-2 shadow-[0_10px_26px_-14px_rgba(46,16,101,0.45)]">
              {actionRow}
            </div>
          )}
        </WalletTabBar>
      ) : (
        actionRow && (
          <div
            className="fixed inset-x-0 bottom-0 z-20 flex gap-2 border-t border-[#EDE3F7] bg-white px-4 py-3"
            style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
          >
            {actionRow}
          </div>
        )
      )}
    </main>
  )
}
