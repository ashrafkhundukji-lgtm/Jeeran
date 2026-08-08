'use client'

import { LANDING_COPY, type LandingCopy } from '@/lib/i18n/landing'
import { getDir, type Locale } from '@/lib/i18n/locale'
import { useLocale } from '@/lib/i18n/useLocale'
import LanguageSwitcher from '@/components/LanguageSwitcher'

// Reused verbatim in several spots below — kept as one literal string so
// Tailwind's content scanner sees the full arbitrary-value class name.
// Work Sans is already the site-wide default (see src/lib/fonts.ts +
// src/app/layout.tsx), so only headings/display type need to opt into
// Archivo explicitly here.
const ARCHIVO = 'font-[family-name:var(--font-archivo)]'

// New copy introduced by this redesign (the wallet-card-stack caption) that
// doesn't exist in LANDING_COPY yet. Scoped locally per the handoff's file
// boundary (LandingPage.tsx + globals.css only) rather than editing
// src/lib/i18n/landing.ts. EN/AR text is the design handoff's own copy
// (docs/design/design_handoff_landing_redesign); UR is a same-meaning
// translation added for consistency with the site's third locale.
const WALLET_HEADLINE: Record<Locale, string> = {
  en: 'A variety of offers, only for Jeeran subscribers',
  ar: 'تشكيلة من العروض، حصراً لمشتركي جيران',
  ur: 'جیران ممبرز کے لیے مختلف اور خصوصی پیشکشیں',
}

export default function LandingPage() {
  const [locale, setLocale] = useLocale()
  const copy = LANDING_COPY[locale]
  const dir = getDir(locale)

  return (
    <main dir={dir} className="relative min-h-screen overflow-hidden bg-[#FBFCFD] text-[#1a1a1a]">
      <NetworkBackground />

      {/* z-20, not z-10 like the sections below: the language switcher's
          dropdown lives inside this header and must paint above the hero
          section. Equal z-index siblings stack by DOM order, and the hero
          section comes after the header — so at z-10/z-10 the hero section
          was winning hit-testing wherever the open dropdown overlapped it,
          silently swallowing every click on a language option. */}
      <header
        dir="ltr"
        className="relative z-20 mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 px-6 pt-8 sm:px-12"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/design/jeeran-logo-redesign.svg" alt="Jeeran Network" className="h-14 w-auto sm:h-16" />
        <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 sm:gap-x-7">
          <a href="/browse" className="py-1 text-sm whitespace-nowrap text-[#6b6b6b] hover:text-[#1a1a1a]">
            {copy.browse}
          </a>
          <a href="/login" className="py-1 text-sm whitespace-nowrap text-[#6b6b6b] hover:text-[#1a1a1a]">
            {copy.login}
          </a>
          <LanguageSwitcher locale={locale} onChange={setLocale} />
        </div>
      </header>

      <section className="relative z-10 mx-auto grid max-w-[1240px] items-center gap-10 px-6 pt-16 pb-20 sm:px-12 sm:pt-20 sm:pb-28 lg:grid-cols-[1.15fr_0.85fr] lg:pt-[88px] lg:pb-[140px]">
        <div>
          <div className="mb-7 h-1.5 w-14 rounded-full bg-[#FF6B4A]" />
          <h1
            className={`${ARCHIVO} mb-7 text-[34px] font-black leading-[0.98] tracking-[-0.01em] sm:text-6xl lg:text-[76px]`}
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
          <p className="mb-10 max-w-[460px] text-[19px] leading-[1.6] text-[#5a5a5a]">{copy.subheadline}</p>
          <a
            href="/signup"
            className="inline-block rounded-[10px] bg-[#FF6B4A] px-8 py-4 text-[15px] font-semibold text-white shadow-[0_12px_24px_-8px_rgba(255,107,74,0.5)] transition-colors hover:bg-[#e85a3b]"
          >
            {copy.ctaBusiness}
          </a>
        </div>

        <WalletCardStack locale={locale} />
      </section>

      <StepSection copy={copy} />

      <footer className="relative z-10 flex items-center justify-center gap-2.5 px-6 py-9">
        <div className="h-2 w-2 rounded-full bg-[#FF6B4A]" />
        <p className="m-0 text-xs text-[#9a9a9a]">Jeeran Network</p>
      </footer>
    </main>
  )
}

// Full-page backdrop: a "community network" graphic — scattered nodes
// connected by thin lines, evoking a connected local network — plus two
// large blurred color blobs for depth. Node/line coordinates are lifted
// directly from the design handoff's SVG for pixel fidelity. Local to this
// file (not the shared src/components/Backdrop.tsx, which other pages use
// and which this redesign's file scope doesn't touch).
function NetworkBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <svg
        viewBox="0 0 1240 900"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
      >
        <g stroke="#1E3A8A" strokeWidth="1.4" opacity="0.16" fill="none">
          <line x1="120" y1="90" x2="300" y2="180" />
          <line x1="300" y1="180" x2="260" y2="340" />
          <line x1="300" y1="180" x2="480" y2="140" />
          <line x1="480" y1="140" x2="620" y2="240" />
          <line x1="620" y1="240" x2="820" y2="150" />
          <line x1="620" y1="240" x2="700" y2="400" />
          <line x1="700" y1="400" x2="540" y2="470" />
          <line x1="540" y1="470" x2="380" y2="420" />
          <line x1="380" y1="420" x2="260" y2="340" />
          <line x1="820" y1="150" x2="1020" y2="220" />
          <line x1="1020" y1="220" x2="1120" y2="380" />
          <line x1="700" y1="400" x2="880" y2="480" />
          <line x1="880" y1="480" x2="1020" y2="600" />
          <line x1="540" y1="470" x2="600" y2="650" />
          <line x1="600" y1="650" x2="420" y2="720" />
          <line x1="260" y1="340" x2="140" y2="500" />
          <line x1="140" y1="500" x2="220" y2="680" />
        </g>
        <g fill="#FF6B4A" opacity="0.55">
          <circle cx="120" cy="90" r="5" />
          <circle cx="480" cy="140" r="4" />
          <circle cx="820" cy="150" r="6" />
          <circle cx="700" cy="400" r="5" />
          <circle cx="1020" cy="600" r="4" />
          <circle cx="420" cy="720" r="5" />
          <circle cx="140" cy="500" r="4" />
        </g>
        <g fill="#1E3A8A" opacity="0.45">
          <circle cx="300" cy="180" r="6" />
          <circle cx="260" cy="340" r="5" />
          <circle cx="620" cy="240" r="7" />
          <circle cx="380" cy="420" r="4" />
          <circle cx="540" cy="470" r="6" />
          <circle cx="1020" cy="220" r="4" />
          <circle cx="1120" cy="380" r="5" />
          <circle cx="880" cy="480" r="5" />
          <circle cx="600" cy="650" r="4" />
          <circle cx="220" cy="680" r="4" />
        </g>
      </svg>
      <div className="absolute -top-[120px] -right-[160px] h-[520px] w-[520px] rounded-full bg-[#FF6B4A] opacity-[0.16] blur-[60px]" />
      <div className="absolute -bottom-[140px] -left-[140px] h-[460px] w-[460px] rounded-full bg-[#1E3A8A] opacity-[0.14] blur-[70px]" />
    </div>
  )
}

// 16-dot (4x4) QR-style pattern for the front card, lifted from the design
// handoff verbatim: 1 = filled (navy), 0 = empty (transparent).
const QR_DOTS = [1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1]

// The hero's wallet-card-stack illustration: a thin ring "network node"
// outline behind three fanned wallet-pass cards (two faint peeking business
// offers, one front-and-center Jeeran subscriber offer with the logo, a
// SUBSCRIBER badge, and a QR-dot grid), plus a peeking coral accent circle.
// Always LTR/English content — like the card's business-name labels below,
// this is illustrative card content, not page copy driven by LANDING_COPY.
function WalletCardStack({ locale }: { locale: Locale }) {
  return (
    <div dir="ltr" className="relative flex h-[400px] items-center justify-center sm:h-[440px] lg:h-[460px]" aria-hidden="true">
      <div className="absolute h-[300px] w-[300px] rounded-full border-[1.5px] border-[#1E3A8A]/25" />

      <div className="relative w-[250px]">
        {/* z-30: higher than every card in the stack below (max z-20). The
            Glow Spa card's rotate+translate shifts it ~123px up, into the
            same vertical space this headline occupies — without an
            explicit z-index it's z-auto and the z-10/z-20 cards paint over
            it, occluding the text. */}
        <p
          className={`${ARCHIVO} absolute inset-x-0 bottom-full z-30 mb-[18px] text-center text-[16px] leading-[1.35] font-extrabold text-[#1E3A8A]`}
        >
          {WALLET_HEADLINE[locale]}
        </p>

        {/* Back card: faint neighboring-business offer (Café Aroma) */}
        <div
          className="absolute top-0 left-0 z-0 box-border h-[150px] w-[250px] overflow-hidden rounded-[20px] border border-[#ececec] bg-white px-5 py-[18px] shadow-[0_20px_40px_-20px_rgba(30,58,138,0.25)]"
          style={{ transform: 'rotate(-9deg) translate(-14px, 34px)' }}
        >
          <div className="text-[9px] font-semibold tracking-[0.08em] text-[#9a9a9a]">CAFÉ AROMA</div>
          <div className={`${ARCHIVO} mt-1 text-[15px] font-extrabold text-[#1a1a1a]`}>Buy 3, Get 1 Free</div>
        </div>

        {/* Front card: the Jeeran subscriber offer — stays in normal flow
            (not absolutely positioned) so it sets this wrapper's height,
            matching the design handoff's own layering. */}
        <div
          className="relative z-20 box-border h-[150px] w-[250px] overflow-hidden rounded-[20px] px-5 py-[18px] text-white shadow-[0_26px_50px_-18px_rgba(30,58,138,0.5)]"
          style={{ background: 'linear-gradient(155deg,#1E3A8A,#2a4fb8)', transform: 'rotate(3deg)' }}
        >
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center rounded-[7px] bg-white px-2.5 py-[5px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/design/jeeran-logo-redesign.svg" alt="Jeeran" className="block h-[22px] w-auto" />
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
          className="absolute top-0 left-0 z-10 box-border h-[150px] w-[250px] overflow-hidden rounded-[20px] border border-[#ececec] bg-white px-5 py-[18px] shadow-[0_20px_40px_-20px_rgba(255,107,74,0.25)]"
          style={{ transform: 'rotate(11deg) translate(16px, -25px)' }}
        >
          <div className="text-[9px] font-semibold tracking-[0.08em] text-[#9a9a9a]">GLOW SPA</div>
          <div className={`${ARCHIVO} mt-1 text-[15px] font-extrabold text-[#1a1a1a]`}>Free Add-On Service</div>
        </div>
      </div>

      <div className="absolute right-4 bottom-1.5 h-[60px] w-[60px] rounded-full bg-[#FF6B4A] opacity-90" />
    </div>
  )
}

// Full-bleed navy section with the diagonal clip-path edge and large
// ghost-numeral typography behind each step.
function StepSection({ copy }: { copy: LandingCopy }) {
  const steps = [
    { number: '01', accent: '#FF6B4A', title: copy.step1Title, body: copy.step1Body },
    { number: '02', accent: '#FFFFFF', title: copy.step2Title, body: copy.step2Body },
    { number: '03', accent: '#FF6B4A', title: copy.step3Title, body: copy.step3Body },
  ]

  return (
    <section
      className="relative z-10 bg-[#1E3A8A] px-6 py-20 sm:px-12 sm:py-24"
      style={{ clipPath: 'polygon(0 3%, 100% 0, 100% 97%, 0 100%)' }}
    >
      <div className="mx-auto grid max-w-[1240px] gap-14 sm:grid-cols-3">
        {steps.map((step) => (
          <Step key={step.number} {...step} />
        ))}
      </div>
    </section>
  )
}

function Step({ number, accent, title, body }: { number: string; accent: string; title: string; body: string }) {
  return (
    <div className="relative">
      <div className={`${ARCHIVO} -mb-8 text-[72px] font-black leading-none text-white/[0.14] sm:-mb-10 sm:text-[110px]`}>
        {number}
      </div>
      <div className="mb-4 h-1 w-9 rounded-sm" style={{ background: accent }} />
      <h3 className={`${ARCHIVO} mb-2.5 text-xl font-bold text-white sm:text-[22px]`}>{title}</h3>
      <p className="max-w-[280px] text-sm leading-relaxed text-white/70 sm:text-[15px]">{body}</p>
    </div>
  )
}
