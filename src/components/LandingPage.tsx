'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { LANDING_COPY, type LandingCopy } from '@/lib/i18n/landing'
import { LOCALES, getDir, type Locale } from '@/lib/i18n/locale'
import { useLocale } from '@/lib/i18n/useLocale'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import BrandLockup from '@/components/BrandLockup'
import { BookmarkIcon, QrIcon, RouteIcon, ScanIcon, TagIcon, CardIcon } from '@/components/customer/icons'

// Landing page (approved mockup: downloads/handoff/landing-auth/landing.html).
// Navy/coral/cream on the shared brand tokens, Readex Pro + IBM Plex Sans
// Arabic, RTL-first. Copy lives in src/lib/i18n/landing.ts — see the claim
// notes there before changing wording.

// Street photo (no text baked in). Served through next/image, so phones get
// a resized WebP rather than the source JPEG.
const PHOTO = '/landing/street.jpg'

// The existing support line (same env var as the frozen-account page);
// the footer shows no contact entry when it isn't configured.
const SUPPORT_WHATSAPP = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP?.replace(/\D/g, '') || null

const FOCUS_DARK = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'
const FOCUS_LIGHT = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-navy'
const BTN = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-6 font-display text-base font-semibold transition-colors motion-reduce:transition-none'
const BTN_PRIMARY = `${BTN} bg-brand-coral text-white hover:bg-[#B5330F]`

export default function LandingPage() {
  const [locale, setLocale] = useLocale()
  const copy = LANDING_COPY[locale]
  const dir = getDir(locale)

  // Mobile-only sticky CTA bar: revealed once the hero's own CTA scrolls out
  // of view, so it never competes with the hero on first paint.
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
    <div dir={dir} lang={locale} className="min-h-screen bg-brand-cream font-body text-brand-navy-deep">
      <Hero copy={copy} locale={locale} setLocale={setLocale} ctaRef={heroCtaRef} />
      <main>
        <HowItWorks copy={copy} />
        <ForCustomers copy={copy} />
        <WhyJeeran copy={copy} />
        <ClosingCta copy={copy} />
      </main>
      <Footer copy={copy} locale={locale} setLocale={setLocale} />

      {/* Sticky mobile CTA bar — desktop never shows it. */}
      <div
        className={`fixed inset-x-0 bottom-0 z-30 flex gap-2.5 border-t border-brand-line bg-brand-cream/95 px-4 pt-3 backdrop-blur-sm transition-transform duration-200 motion-reduce:transition-none md:hidden ${
          showStickyBar ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}
        aria-hidden={!showStickyBar}
      >
        <a href="/signup" tabIndex={showStickyBar ? 0 : -1} className={`${BTN_PRIMARY} flex-1 ${FOCUS_LIGHT}`}>
          {copy.hero.ctaOwner}
        </a>
        <a
          href="/browse"
          tabIndex={showStickyBar ? 0 : -1}
          className={`${BTN} shrink-0 border border-brand-line bg-white px-4 text-brand-navy-deep ${FOCUS_LIGHT}`}
        >
          {copy.nav.browse}
        </a>
      </div>
    </div>
  )
}

function Hero({
  copy,
  locale,
  setLocale,
  ctaRef,
}: {
  copy: LandingCopy
  locale: Locale
  setLocale: (l: Locale) => void
  ctaRef: React.RefObject<HTMLAnchorElement | null>
}) {
  return (
    <div className="relative isolate overflow-hidden bg-brand-navy-deep text-white">
      <Image src={PHOTO} alt={copy.hero.photoAlt} fill preload sizes="100vw" className="-z-20 object-cover object-[center_40%]" />
      {/* Legibility wash. Phones: the text sits at the top over the bright
          sky, so the wash stays dense top to bottom (measured ≥ 4.5:1 for
          white text). Desktop: strongest behind the text column (right in
          RTL, left in LTR), fading toward the sample card. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,rgba(18,41,107,0.86)_0%,rgba(18,41,107,0.8)_50%,rgba(18,41,107,0.94)_100%)] lg:rtl:bg-[linear-gradient(to_left,rgba(18,41,107,0.9)_0%,rgba(18,41,107,0.64)_46%,rgba(18,41,107,0.14)_100%)] lg:ltr:bg-[linear-gradient(to_right,rgba(18,41,107,0.9)_0%,rgba(18,41,107,0.64)_46%,rgba(18,41,107,0.14)_100%)]"
      />

      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex max-w-[1240px] items-center gap-3 px-[18px] py-3.5 lg:px-10 lg:py-4">
          <BrandLockup locale={locale} tone="dark" />
          <nav aria-label={copy.brand} className="ms-auto hidden items-center gap-1 md:flex">
            {[
              { href: '/browse', label: copy.nav.browse },
              { href: '#customers', label: copy.nav.customers },
              { href: '/login', label: copy.nav.login },
            ].map((l) => (
              <a key={l.href} href={l.href} className={`flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-white/90 hover:text-white ${FOCUS_DARK}`}>
                {l.label}
              </a>
            ))}
          </nav>
          <a href="/login" className={`ms-auto flex min-h-11 items-center rounded-lg px-2 text-sm font-semibold md:hidden ${FOCUS_DARK}`}>
            {copy.nav.loginShort}
          </a>
          <div className="md:hidden">
            <LanguageSwitcher locale={locale} onChange={setLocale} tone="dark" compact />
          </div>
          <div className="hidden md:block">
            <LanguageSwitcher locale={locale} onChange={setLocale} tone="dark" />
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-[1240px] gap-8 px-[18px] pt-[92px] pb-9 lg:min-h-[600px] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-end lg:gap-9 lg:px-10 lg:pt-[150px] lg:pb-[70px]">
        <div>
          <h1 className="mb-3.5 font-display text-[32px] leading-[1.3] font-bold text-balance sm:text-[40px] lg:mb-4 lg:text-[clamp(40px,4.4vw,58px)]">
            {copy.hero.headline}
          </h1>
          <p className="mb-6 max-w-[34em] text-base leading-[1.75] text-brand-tint lg:mb-7 lg:text-lg">{copy.hero.sub}</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a ref={ctaRef} href="/signup" className={`${BTN_PRIMARY} ${FOCUS_DARK}`}>
              {copy.hero.ctaOwner}
            </a>
            <a href="/browse" className={`${BTN} border border-white/60 bg-brand-navy-deep/55 text-white hover:bg-brand-navy-deep/75 ${FOCUS_DARK}`}>
              {copy.hero.ctaCustomer}
            </a>
          </div>
          <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-brand-tint-2">
            {copy.hero.assurances.map((a) => (
              <li key={a} className="flex items-center gap-2">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brand-coral-brand" />
                {a}
              </li>
            ))}
          </ul>
        </div>

        <SampleCard copy={copy} />
      </section>
    </div>
  )
}

// Illustration of the real Google Wallet pass (navy, white mark in a
// ringed circle, street photo, QR + redeem code), labelled as an example.
// No shop or offer names, and nothing the real pass doesn't have.
function SampleCard({ copy }: { copy: LandingCopy }) {
  return (
    <figure className="m-0 mx-auto flex w-[min(300px,100%)] flex-col items-center lg:me-0">
      <div className="w-full overflow-hidden rounded-[22px] bg-brand-navy shadow-[0_24px_50px_rgba(8,16,60,0.45)] lg:rtl:-rotate-[2.5deg] lg:ltr:rotate-[2.5deg]">
        <div className="flex items-center gap-2.5 px-[18px] pt-4 pb-1.5">
          <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full ring-1 ring-white/70">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/design/jeeran-mark-white.svg" alt="" className="h-[18px] w-[18px]" />
          </span>
          <span className="font-display text-[15px] font-semibold">{copy.brand}</span>
        </div>
        <p className="px-[18px] pt-0.5 pb-3 font-display text-[21px] leading-[1.35] font-bold">{copy.sampleCard.title}</p>
        <div className="px-[18px] pb-3.5 text-xs text-brand-tint-2">
          {copy.sampleCard.codeLabel}
          <b dir="ltr" className="block font-display text-sm font-semibold text-white rtl:text-right">
            ABCD-EFGH
          </b>
        </div>
        <div className="relative h-[110px]">
          <Image src={PHOTO} alt="" fill sizes="300px" className="object-cover object-[center_60%]" />
        </div>
        <div className="m-3.5 flex flex-col items-center gap-2 rounded-xl bg-white p-3 text-brand-navy-deep">
          <SampleQr />
          <span dir="ltr" className="font-display text-sm leading-none font-semibold tracking-[0.18em]">
            ABCD-EFGH
          </span>
        </div>
      </div>
      <figcaption className="mt-3 rounded-md bg-white/16 px-2.5 py-0.5 text-xs text-white">{copy.sampleCard.label}</figcaption>
    </figure>
  )
}

// Decorative QR-style block (three finder squares + a fixed module
// pattern). Not a scannable code.
const QR_SIZE = 21
const QR_MODULES: [number, number][] = (() => {
  const cells: [number, number][] = []
  let seed = 7
  const inFinder = (x: number, y: number) =>
    (x < 8 && y < 8) || (x >= QR_SIZE - 8 && y < 8) || (x < 8 && y >= QR_SIZE - 8)
  for (let y = 0; y < QR_SIZE; y++) {
    for (let x = 0; x < QR_SIZE; x++) {
      seed = (seed * 1103515245 + 12345) % 2147483648
      if (!inFinder(x, y) && seed % 100 < 46) cells.push([x, y])
    }
  }
  return cells
})()

function SampleQr() {
  const finder = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width="7" height="7" fill="currentColor" />
      <rect x={x + 1} y={y + 1} width="5" height="5" fill="#fff" />
      <rect x={x + 2} y={y + 2} width="3" height="3" fill="currentColor" />
    </g>
  )
  return (
    <svg viewBox={`0 0 ${QR_SIZE} ${QR_SIZE}`} width="96" height="96" shapeRendering="crispEdges" aria-hidden="true">
      {finder(0, 0)}
      {finder(QR_SIZE - 7, 0)}
      {finder(0, QR_SIZE - 7)}
      {QR_MODULES.map(([x, y]) => (
        <rect key={`${x}.${y}`} x={x} y={y} width="1" height="1" fill="currentColor" />
      ))}
    </svg>
  )
}

function HowItWorks({ copy }: { copy: LandingCopy }) {
  const icons = [QrIcon, RouteIcon, CardIcon]
  return (
    <section aria-labelledby="how-heading" className="mx-auto max-w-[1240px] px-[18px] py-11 lg:px-10 lg:py-[72px]">
      <p className="mb-2 font-display text-[13px] font-semibold text-brand-coral">{copy.how.eyebrow}</p>
      <h2 id="how-heading" className="mb-8 max-w-[20em] font-display text-[26px] leading-[1.35] font-bold text-balance lg:mb-9 lg:text-[clamp(26px,3vw,36px)]">
        {copy.how.heading}
      </h2>
      <ol className="grid gap-5 md:grid-cols-3">
        {copy.how.steps.map((step, i) => {
          const Icon = icons[i]
          return (
            <li key={step.title} className="rounded-2xl border border-brand-line bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="flex h-[46px] w-[46px] items-center justify-center rounded-xl bg-brand-tint text-brand-navy">
                  <Icon size={24} strokeWidth={1.8} />
                </span>
                <span aria-hidden="true" className="font-display text-sm font-semibold text-brand-muted">
                  {i + 1}
                </span>
              </div>
              <h3 className="mb-1.5 font-display text-lg font-semibold">{step.title}</h3>
              <p className="m-0 text-[15px] leading-[1.7] text-brand-muted">{step.body}</p>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

function ForCustomers({ copy }: { copy: LandingCopy }) {
  const icons = [ScanIcon, BookmarkIcon, TagIcon]
  return (
    <section id="customers" aria-labelledby="customers-heading" className="scroll-mt-4 bg-brand-navy-deep text-white">
      <div className="mx-auto grid max-w-[1240px] items-center gap-8 px-[18px] py-11 md:grid-cols-2 md:gap-10 lg:px-10 lg:py-[72px]">
        <div className="relative order-first min-h-[200px] overflow-hidden rounded-[18px] shadow-[0_18px_40px_rgba(0,0,0,0.3)] md:order-last md:min-h-[340px]">
          <Image src={PHOTO} alt={copy.customers.photoAlt} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover object-[30%_50%]" />
        </div>
        <div>
          <p className="mb-2 font-display text-[13px] font-semibold text-brand-coral-brand">{copy.customers.eyebrow}</p>
          <h2 id="customers-heading" className="mb-8 font-display text-[26px] leading-[1.35] font-bold text-balance lg:text-[clamp(26px,3vw,36px)]">
            {copy.customers.heading}
          </h2>
          <ol className="grid gap-4">
            {copy.customers.rows.map((row, i) => {
              const Icon = icons[i]
              return (
                <li key={row.title} className="flex items-start gap-3.5">
                  <span className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-xl bg-white/10">
                    <Icon size={24} strokeWidth={1.8} />
                  </span>
                  <div>
                    <h3 className="mb-0.5 font-display text-[17px] font-semibold">{row.title}</h3>
                    <p className="m-0 text-[15px] leading-[1.7] text-brand-tint-2">{row.body}</p>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      </div>
    </section>
  )
}

function WhyJeeran({ copy }: { copy: LandingCopy }) {
  return (
    <section aria-labelledby="why-heading" className="mx-auto max-w-[1240px] px-[18px] py-11 lg:px-10 lg:py-[72px]">
      <p className="mb-2 font-display text-[13px] font-semibold text-brand-coral">{copy.why.eyebrow}</p>
      <h2 id="why-heading" className="mb-8 font-display text-[26px] leading-[1.35] font-bold text-balance lg:mb-9 lg:text-[clamp(26px,3vw,36px)]">
        {copy.why.heading}
      </h2>
      <ul className="grid gap-6 md:grid-cols-3 md:gap-5">
        {copy.why.points.map((p) => (
          <li key={p.title} className="border-t-[3px] border-brand-coral-brand pt-3.5">
            <h3 className="mb-1 font-display text-lg font-semibold">{p.title}</h3>
            <p className="m-0 text-[15px] leading-[1.7] text-brand-muted">{p.body}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

function ClosingCta({ copy }: { copy: LandingCopy }) {
  return (
    <section aria-labelledby="closing-heading" className="bg-brand-tint px-[18px] py-11 text-center lg:py-[72px]">
      <h2 id="closing-heading" className="mx-auto mb-2 max-w-[20em] font-display text-[26px] leading-[1.35] font-bold text-balance lg:text-[clamp(26px,3vw,36px)]">
        {copy.closing.heading}
      </h2>
      <p className="mx-auto mb-6 text-brand-muted">{copy.closing.sub}</p>
      <a href="/signup" className={`${BTN_PRIMARY} ${FOCUS_LIGHT}`}>
        {copy.hero.ctaOwner}
      </a>
    </section>
  )
}

function Footer({ copy, locale, setLocale }: { copy: LandingCopy; locale: Locale; setLocale: (l: Locale) => void }) {
  const link = `flex min-h-11 items-center text-brand-tint-2 hover:text-white ${FOCUS_DARK} rounded`
  return (
    <footer className="bg-brand-navy-deep px-[18px] pt-10 pb-[108px] text-sm text-brand-tint-2 md:pb-7 lg:px-10">
      <div className="mx-auto grid max-w-[1240px] gap-7 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="mb-2.5">
            <BrandLockup locale={locale} tone="dark" href={null} />
          </div>
          <p className="m-0 max-w-[28em] leading-[1.7]">{copy.footer.tagline}</p>
        </div>
        <div>
          <h2 className="mb-2 font-display text-sm font-semibold text-white">{copy.footer.product}</h2>
          <a href="/browse" className={link}>{copy.nav.browse}</a>
          <a href="/signup" className={link}>{copy.footer.forShops}</a>
          <a href="#customers" className={link}>{copy.nav.customers}</a>
        </div>
        {SUPPORT_WHATSAPP && (
          <div>
            <h2 className="mb-2 font-display text-sm font-semibold text-white">{copy.footer.contact}</h2>
            <a href={`https://wa.me/${SUPPORT_WHATSAPP}`} target="_blank" rel="noopener noreferrer" className={link}>
              {copy.footer.whatsapp}
            </a>
          </div>
        )}
        <div>
          <h2 className="mb-2 font-display text-sm font-semibold text-white">{copy.footer.language}</h2>
          {LOCALES.map((l) => (
            <button
              key={l.code}
              type="button"
              lang={l.code}
              onClick={() => setLocale(l.code)}
              aria-current={l.code === locale ? 'true' : undefined}
              className={`${link} ${l.code === locale ? 'font-semibold text-white' : ''}`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
      <p className="mx-auto mt-7 max-w-[1240px] border-t border-white/14 pt-4 text-xs text-brand-tint-2/90">
        © {new Date().getFullYear()} {copy.footer.rights}
      </p>
    </footer>
  )
}
