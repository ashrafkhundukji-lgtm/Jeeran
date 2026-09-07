'use client'

import { useEffect, useRef, useState } from 'react'
import { LANDING_COPY, type LandingCopy } from '@/lib/i18n/landing'
import { getDir, type Locale } from '@/lib/i18n/locale'
import { useLocale } from '@/lib/i18n/useLocale'
import { displayFont } from '@/lib/i18n/displayFont'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import Backdrop from '@/components/Backdrop'

// Reused verbatim in several spots below — kept as one literal string so
// Tailwind's content scanner sees the full arbitrary-value class name.
// Work Sans is already the site-wide default (see src/lib/fonts.ts +
// src/app/layout.tsx), so only headings/display type need to opt into
// Archivo explicitly here. displayFont(locale) (src/lib/i18n/displayFont.ts)
// swaps to the real Arabic display face for locale-driven text — see that
// file's comment. The illustrative wallet-card mock content (business
// names, "Exclusive Member Deal", ghost step numerals) is always
// English/numeral by design and keeps plain ARCHIVO regardless of locale.
const ARCHIVO = 'font-[family-name:var(--font-archivo)]'

export default function LandingPage() {
  const [locale, setLocale] = useLocale()
  const copy = LANDING_COPY[locale]
  const dir = getDir(locale)

  // Mobile-only sticky CTA bar (design_handoff_jeeran_mobile/README.md §8):
  // revealed once the hero's own CTA button scrolls out of view, so it
  // doesn't compete with the hero on first paint.
  const heroCtaRef = useRef<HTMLAnchorElement>(null)
  const [showStickyBar, setShowStickyBar] = useState(false)
  useEffect(() => {
    const el = heroCtaRef.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setShowStickyBar(!entry.isIntersecting), { threshold: 0 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <main dir={dir} className="relative min-h-screen overflow-hidden bg-[#FBFCFD] pb-[72px] text-[#1a1a1a] md:pb-0">
      <Backdrop />

      {/* z-20, not z-10 like the sections below: the language switcher's
          dropdown lives inside this header and must paint above the hero
          section. Equal z-index siblings stack by DOM order, and the hero
          section comes after the header — so at z-10/z-10 the hero section
          was winning hit-testing wherever the open dropdown overlapped it,
          silently swallowing every click on a language option. */}
      <header className="relative z-20 mx-auto flex max-w-[1240px] items-center justify-between gap-4 px-6 pt-8 sm:px-12">
        {/* Mobile: mark + wordmark. The 800×500 full lockup renders a ~20px
            mark inside a visible box at this width (BUGS.md item 2) —
            jeeran-mark.svg plus a plain text wordmark instead. */}
        <a href="/" className="flex items-center gap-2 md:hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/design/jeeran-mark.svg" alt="" aria-hidden="true" className="h-7 w-7" />
          <span className={`${ARCHIVO} text-[17px] font-black text-[#1E3A8A]`}>Jeeran</span>
        </a>
        {/* Desktop: unchanged full lockup. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/design/jeeran-logo-redesign.svg" alt="Jeeran Network" className="hidden h-14 w-auto md:block md:h-16" />

        {/* Mobile nav: shortened labels — full "تصفح المحلات" + "تسجيل
            الدخول" + "العربية (AR)" is three items wrapping to two rows at
            390px. */}
        <div className="flex items-center gap-2 md:hidden">
          <a href="/browse" className="px-2 py-1.5 text-[13px] text-[#5a5a5a]">
            {copy.browseShort}
          </a>
          <a href="/login" className="rounded-full border border-[#e2e2e2] px-[13px] py-[7px] text-[13px] font-semibold">
            {copy.loginShort}
          </a>
          <LanguageSwitcher locale={locale} onChange={setLocale} compact />
        </div>
        {/* Desktop: unchanged full labels. */}
        <div className="hidden items-center gap-x-7 md:flex">
          <a href="/browse" className="py-1 text-sm whitespace-nowrap text-[#6b6b6b] hover:text-[#1a1a1a]">
            {copy.browse}
          </a>
          <a href="/login" className="py-1 text-sm whitespace-nowrap text-[#6b6b6b] hover:text-[#1a1a1a]">
            {copy.login}
          </a>
          <LanguageSwitcher locale={locale} onChange={setLocale} />
        </div>
      </header>

      <section className="relative z-10 mx-auto grid max-w-[1240px] items-center gap-10 px-6 pt-5 pb-8 sm:px-12 sm:pt-20 sm:pb-28 lg:grid-cols-[1.15fr_0.85fr] lg:pt-[88px] lg:pb-[140px]">
        <div>
          <div className="mb-[18px] h-[5px] w-[46px] rounded-full bg-[#FF6B4A] sm:mb-7 sm:h-1.5 sm:w-14" />
          <h1
            className={`${displayFont(locale)} mb-[14px] text-[33px] font-bold leading-[1.22] tracking-[-0.01em] sm:mb-7 sm:text-6xl sm:font-black sm:leading-[0.98] lg:text-[76px]`}
          >
            {/*
              Design spec renders this as two lines, the second in navy
              (#1E3A8A) — e.g. "Your offers," / "everywhere they go." That
              split (and the wording itself, since the spec's headline
              differs from our current tagline) is on hold pending the
              headline decision. Rendering the current LANDING_COPY tagline
              at full size/weight in the meantime.
            */}
            {copy.headline}
          </h1>
          {/* Mobile: trimmed to the first sentence — the full paragraph is
              19px x 4 lines at this width. Desktop keeps the full copy. */}
          <p className="mb-[22px] max-w-[460px] text-[16px] leading-[1.65] text-[#5a5a5a] sm:hidden">{copy.subheadlineShort}</p>
          <p className="mb-10 hidden max-w-[460px] text-[19px] leading-[1.6] text-[#5a5a5a] sm:block">{copy.subheadline}</p>
          <a
            ref={heroCtaRef}
            href="/signup"
            className="inline-block rounded-[10px] bg-[#FF6B4A] px-8 py-4 text-[15px] font-semibold text-white shadow-[0_12px_24px_-8px_rgba(255,107,74,0.5)] transition-colors hover:bg-[#e85a3b]"
          >
            {copy.ctaBusiness}
          </a>
        </div>

        <WalletCardStack locale={locale} headline={copy.walletHeadline} />
      </section>

      <StepSection copy={copy} locale={locale} />

      <ClosingCtaSection copy={copy} locale={locale} />

      <footer className="relative z-10 flex items-center justify-center gap-2.5 border-t border-[#ececec] px-6 py-6">
        <div className="h-2 w-2 rounded-full bg-[#FF6B4A]" />
        <p className="m-0 text-xs text-[#9a9a9a]">Jeeran Network</p>
      </footer>

      {/* Sticky mobile CTA bar — revealed once the hero button above scrolls
          out of view (see the IntersectionObserver above). Desktop never
          shows it regardless of scroll position. */}
      <div
        className={`fixed inset-x-0 bottom-0 z-20 flex gap-[9px] border-t border-[#e8e8e8] bg-[rgba(251,252,253,0.94)] px-4 pt-[11px] backdrop-blur-[8px] transition-transform duration-200 md:hidden ${
          showStickyBar ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ paddingBottom: 'calc(22px + env(safe-area-inset-bottom))' }}
      >
        <a
          href="/signup"
          className="flex-1 rounded-[14px] bg-[#FF6B4A] py-[15px] text-center text-[15px] font-semibold text-white"
        >
          {copy.ctaBusiness}
        </a>
        <a
          href="/browse"
          className="shrink-0 rounded-[14px] border border-[#dcdcdc] px-[18px] py-[15px] text-[15px] font-semibold text-[#1a1a1a]"
        >
          {copy.browse}
        </a>
      </div>
    </main>
  )
}

// 16-dot (4x4) QR-style pattern for the front card, lifted from the design
// handoff verbatim: 1 = filled (navy), 0 = empty (transparent).
const QR_DOTS = [1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1]

// The hero's wallet-card-stack illustration: a thin ring "network node"
// outline behind three fanned wallet-pass cards (two faint peeking business
// offers, one front-and-center Jeeran subscriber offer with the logo mark, a
// SUBSCRIBER badge, and a QR-dot grid), plus a peeking coral accent circle —
// all purely decorative and aria-hidden — with the real WALLET_HEADLINE
// caption as a sibling below it (not overlapping, and not hidden from
// screen readers — see BUGS.md item 3). Card content (business names, "Buy
// 3, Get 1 Free", etc.) is always LTR/English mock content, not page copy.
function WalletCardStack({ locale, headline }: { locale: Locale; headline: string }) {
  return (
    <div className="flex flex-col items-center">
      <div dir="ltr" className="relative flex h-[290px] w-full items-center justify-center sm:h-[440px] lg:h-[460px]" aria-hidden="true">
        <div className="absolute h-[236px] w-[236px] rounded-full border-[1.5px] border-[#1E3A8A]/25 sm:h-[300px] sm:w-[300px]" />

        <div className="relative w-[214px] sm:w-[250px]">
          {/* Back card: faint neighboring-business offer (Café Aroma) */}
          <div
            className="absolute top-0 left-0 z-0 box-border h-[129px] w-[214px] overflow-hidden rounded-[18px] border border-[#ececec] bg-white px-5 py-[18px] shadow-[0_20px_40px_-20px_rgba(30,58,138,0.25)] sm:h-[150px] sm:w-[250px] sm:rounded-[20px]"
            style={{ transform: 'rotate(-9deg) translate(-14px, 34px)' }}
          >
            <div className="text-[9px] font-semibold tracking-[0.08em] text-[#9a9a9a]">CAFÉ AROMA</div>
            <div className={`${ARCHIVO} mt-1 text-[15px] font-extrabold text-[#1a1a1a]`}>Buy 3, Get 1 Free</div>
          </div>

          {/* Front card: the Jeeran subscriber offer — stays in normal flow
              (not absolutely positioned) so it sets this wrapper's height,
              matching the design handoff's own layering. */}
          <div
            className="relative z-20 box-border h-[129px] w-[214px] overflow-hidden rounded-[18px] px-5 py-[18px] text-white shadow-[0_26px_50px_-18px_rgba(30,58,138,0.5)] sm:h-[150px] sm:w-[250px] sm:rounded-[20px]"
            style={{ background: 'linear-gradient(155deg,#1E3A8A,#2a4fb8)', transform: 'rotate(3deg)' }}
          >
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center rounded-[7px] bg-white px-2 py-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/design/jeeran-mark.svg" alt="Jeeran" className="block h-[19px] w-[19px]" />
              </div>
              <span className="rounded-[5px] bg-[rgba(255,107,74,0.9)] px-[7px] py-[3px] text-[8px] font-bold tracking-[0.08em]">
                SUBSCRIBER
              </span>
            </div>
            <div className="mt-[14px] text-[9px] tracking-[0.06em] opacity-65">ACTIVE OFFER</div>
            <div className={`${ARCHIVO} mt-0.5 text-[15px] font-extrabold whitespace-nowrap tracking-tight`}>
              Exclusive Member Deal
            </div>
            <div className="mt-2.5 flex items-end justify-between">
              <div className="text-[8px] opacity-55">JEERAN NETWORK</div>
              <div className="box-border grid h-8 w-8 grid-cols-4 gap-[1.5px] rounded-[5px] bg-white p-[3px]">
                {QR_DOTS.map((on, i) => (
                  <div key={i} className={`rounded-[1px] ${on ? 'bg-[#1E3A8A]' : 'bg-transparent'}`} />
                ))}
              </div>
            </div>
          </div>

          {/* Back card: faint neighboring-business offer (Glow Spa) */}
          <div
            className="absolute top-0 left-0 z-10 box-border h-[129px] w-[214px] overflow-hidden rounded-[18px] border border-[#ececec] bg-white px-5 py-[18px] shadow-[0_20px_40px_-20px_rgba(255,107,74,0.25)] sm:h-[150px] sm:w-[250px] sm:rounded-[20px]"
            style={{ transform: 'rotate(11deg) translate(16px, -25px)' }}
          >
            <div className="text-[9px] font-semibold tracking-[0.08em] text-[#9a9a9a]">GLOW SPA</div>
            <div className={`${ARCHIVO} mt-1 text-[15px] font-extrabold text-[#1a1a1a]`}>Free Add-On Service</div>
          </div>
        </div>

        <div className="absolute right-4 bottom-1.5 h-[60px] w-[60px] rounded-full bg-[#FF6B4A] opacity-90" />
      </div>

      {/* Real marketing copy, so unlike the illustration above it's a normal
          sibling, not aria-hidden — was previously nested inside that hidden
          wrapper and invisible to screen readers (BUGS.md item 3). Placed
          below rather than overlapping the top of the stack (its old
          bottom-full position collided with the h1 on narrow screens). */}
      <p dir="ltr" className={`${displayFont(locale)} mt-4 max-w-[280px] text-center text-[14px] leading-[1.5] font-semibold text-[#1E3A8A]`}>
        {headline}
      </p>
    </div>
  )
}

// Full-bleed navy section with the diagonal clip-path edge and large
// ghost-numeral typography behind each step.
function StepSection({ copy, locale }: { copy: LandingCopy; locale: Locale }) {
  const steps = [
    { number: '01', accent: '#FF6B4A', title: copy.step1Title, body: copy.step1Body },
    { number: '02', accent: '#FFFFFF', title: copy.step2Title, body: copy.step2Body },
    { number: '03', accent: '#FF6B4A', title: copy.step3Title, body: copy.step3Body },
  ]

  return (
    <section
      className="relative z-10 bg-[#1E3A8A] px-6 py-[44px] sm:px-12 sm:py-24"
      // Fixed px inset, not a percentage: at 3% a ~900px-tall mobile section
      // reads as a much steeper wedge than the same clip on a short desktop
      // section. A fixed 12px keeps the same visual angle at every height.
      style={{ clipPath: 'polygon(0 12px, 100% 0, 100% calc(100% - 12px), 0 100%)' }}
    >
      <div className="mx-auto grid max-w-[1240px] gap-[34px] sm:grid-cols-3 sm:gap-14">
        {steps.map((step) => (
          <Step key={step.number} {...step} locale={locale} />
        ))}
      </div>
    </section>
  )
}

function Step({
  number,
  accent,
  title,
  body,
  locale,
}: {
  number: string
  accent: string
  title: string
  body: string
  locale: Locale
}) {
  return (
    <div className="relative">
      <div className={`${ARCHIVO} -mb-8 text-[64px] font-black leading-none text-white/[0.15] sm:-mb-10 sm:text-[110px]`}>
        {number}
      </div>
      <div className="mb-4 h-1 w-[34px] rounded-sm" style={{ background: accent }} />
      <h3 className={`${displayFont(locale)} mb-2.5 text-xl font-bold text-white sm:text-[22px]`}>{title}</h3>
      {/* Opacity raised from /70 to /78 — white/70 on #1E3A8A is ~4.1:1,
          under the 4.5:1 floor for 14.5px body text. */}
      <p className="max-w-[280px] text-sm leading-relaxed text-white/[0.78] sm:text-[15px]">{body}</p>
    </div>
  )
}

// New closing section (design_handoff_jeeran_mobile/README.md §8) — today
// the only CTA is above ~1,100px of content; this gives mobile visitors a
// second one after reading the steps, without waiting on the sticky bar.
function ClosingCtaSection({ copy, locale }: { copy: LandingCopy; locale: Locale }) {
  return (
    <section className="relative z-10 px-6 py-[44px] text-center sm:px-12 sm:py-10">
      <h2 className={`${displayFont(locale)} mb-2.5 text-[25px] font-bold leading-[1.3]`}>{copy.closingCtaHeading}</h2>
      <p className="mx-auto mb-[22px] max-w-[420px] text-[15px] leading-[1.6] text-[#5a5a5a]">{copy.closingCtaSubtitle}</p>
      <a
        href="/signup"
        className="inline-block rounded-[14px] bg-[#FF6B4A] px-8 py-4 text-[16px] font-semibold text-white shadow-[0_12px_24px_-10px_rgba(255,107,74,0.55)] transition-colors hover:bg-[#e85a3b]"
      >
        {copy.ctaBusiness}
      </a>
    </section>
  )
}
