'use client'

import { LANDING_COPY, type LandingCopy } from '@/lib/i18n/landing'
import { getDir } from '@/lib/i18n/locale'
import { useLocale } from '@/lib/i18n/useLocale'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import Backdrop from '@/components/Backdrop'

// Reused verbatim in several spots below — kept as one literal string so
// Tailwind's content scanner sees the full arbitrary-value class name.
// Work Sans is already the site-wide default (see src/lib/fonts.ts +
// src/app/layout.tsx), so only headings/display type need to opt into
// Archivo explicitly here.
const ARCHIVO = 'font-[family-name:var(--font-archivo)]'

export default function LandingPage() {
  const [locale, setLocale] = useLocale()
  const copy = LANDING_COPY[locale]
  const dir = getDir(locale)

  return (
    <main dir={dir} className="relative min-h-screen overflow-hidden bg-[#FBFCFD] text-[#1a1a1a]">
      <Backdrop diamonds />

      {/* z-20, not z-10 like the sections below: the language switcher's
          dropdown lives inside this header and must paint above the hero
          section. Equal z-index siblings stack by DOM order, and the hero
          section comes after the header — so at z-10/z-10 the hero section
          was winning hit-testing wherever the open dropdown overlapped it,
          silently swallowing every click on a language option. Confirmed
          via elementFromPoint() at each option's coordinates before this
          fix: it returned the hero <section>, never the option button. */}
      <header
        dir="ltr"
        className="relative z-20 mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 px-6 pt-8 sm:px-12"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/jeeran-logo.svg" alt="Jeeran Network" className="h-28 w-auto sm:h-32" />
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
          <p className="mb-10 max-w-[460px] text-lg leading-relaxed text-[#5a5a5a] sm:text-[19px]">
            {copy.subheadline}
          </p>
          <a
            href="/signup"
            className="inline-block rounded-[10px] bg-[#FF6B4A] px-8 py-4 text-sm font-semibold text-white shadow-[0_12px_24px_-8px_rgba(255,107,74,0.5)] transition-colors hover:bg-[#e85a3b]"
          >
            {copy.ctaBusiness}
          </a>
        </div>

        <WalletPassIllustration />
      </section>

      <StepSection copy={copy} />

      <footer className="relative z-10 flex items-center justify-center gap-2.5 px-6 py-9">
        <div className="h-2 w-2 rounded-full bg-[#FF6B4A]" />
        <p className="m-0 text-xs text-[#9a9a9a]">Jeeran Network</p>
      </footer>
    </main>
  )
}

// The hero's wallet-pass card illustration: a ring, a tilted navy pass with
// a barcode strip, and a peeking orange accent circle behind it.
function WalletPassIllustration() {
  return (
    <div dir="ltr" className="relative flex h-[300px] items-center justify-center sm:h-[420px]" aria-hidden="true">
      <div className="absolute h-[280px] w-[280px] rounded-full border-[1.5px] border-[#1E3A8A]/25" />
      <div
        className="relative flex h-[340px] w-[230px] rotate-6 flex-col justify-between rounded-[22px] p-6 text-white shadow-[0_30px_60px_-20px_rgba(30,58,138,0.5)]"
        style={{ background: 'linear-gradient(155deg,#1E3A8A,#2a4fb8)' }}
      >
        <div>
          <div className="mb-1.5 text-[11px] tracking-[0.08em] opacity-60">JEERAN OFFER</div>
          <div className={`${ARCHIVO} text-[15px] leading-snug font-extrabold`}>
            Irresistible Deals Exclusive To Jeeran Members
          </div>
        </div>
        <div>
          <div
            className="mb-2.5 h-9"
            style={{
              backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.8) 0 2px, transparent 2px 5px)',
            }}
          />
          <div className="text-[10px] opacity-55">VALID AT ANY PARTNER LOCATION</div>
        </div>
      </div>
      <div className="absolute right-5 bottom-2.5 h-[70px] w-[70px] rounded-full bg-[#FF6B4A] opacity-90" />
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
