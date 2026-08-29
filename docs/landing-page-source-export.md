# Jeeran Landing Page — Source Export

Files gathered for redesign context. Not included (not uploaded): `@/lib/i18n/landing` (LANDING_COPY strings), `@/lib/i18n/locale`, `@/lib/i18n/useLocale`, `LanguageSwitcher`, `MapBackground`, `tailwind.config` (project uses Tailwind v4 CSS-based config, no separate config file found), `/jeeran-logo.svg`.

## src/app/page.tsx

```tsx
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import LandingPage from '@/components/LandingPage'

export default async function Home() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return <LandingPage />
}
```

## src/components/LandingPage.tsx

```tsx
'use client'

import { LANDING_COPY } from '@/lib/i18n/landing'
import { getDir } from '@/lib/i18n/locale'
import { useLocale } from '@/lib/i18n/useLocale'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import MapBackground from '@/components/MapBackground'

export default function LandingPage() {
  const [locale, setLocale] = useLocale()
  const copy = LANDING_COPY[locale]
  const dir = getDir(locale)

  return (
    <main dir={dir} className="relative min-h-screen bg-[#FBFCFD] overflow-hidden">
      <MapBackground />

      <header dir="ltr" className="relative z-10 max-w-5xl mx-auto px-6 py-6 flex items-center justify-end gap-4">
        <LanguageSwitcher locale={locale} onChange={setLocale} />
        <a href="/browse" className="text-sm text-neutral-500 underline">
          {copy.browse}
        </a>
        <a href="/login" className="text-sm text-neutral-500 underline">
          {copy.login}
        </a>
      </header>

      <section className="relative z-10 max-w-3xl mx-auto px-6 pt-6 sm:pt-10 pb-20 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/jeeran-logo.svg"
          alt="Jeeran Network"
          className="h-32 sm:h-40 w-auto mx-auto mb-8"
        />

        <div className="w-10 h-1 rounded-full bg-[#FF6B4A] mx-auto mb-4" />
        {copy.brandSubtitle && <p className="text-sm text-neutral-400 mb-3">{copy.brandSubtitle}</p>}
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-5">{copy.headline}</h1>
        <p className="text-lg text-neutral-600 max-w-xl mx-auto mb-10">{copy.subheadline}</p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/signup"
            className="bg-[#FF6B4A] text-white rounded-lg px-6 py-3 text-sm font-medium shadow-sm shadow-[#FF6B4A]/20 transition-colors hover:bg-[#e85a3b]"
          >
            {copy.ctaBusiness}
          </a>
        </div>
      </section>

      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-24 grid sm:grid-cols-3 gap-8">
        <Step number="1" title={copy.step1Title} body={copy.step1Body} />
        <Step number="2" title={copy.step2Title} body={copy.step2Body} />
        <Step number="3" title={copy.step3Title} body={copy.step3Body} />
      </section>

      <footer className="relative z-10 border-t border-neutral-100 py-8 bg-white/60 backdrop-blur-sm">
        <p className="text-center text-xs text-neutral-400">Jeeran Network</p>
      </footer>
    </main>
  )
}

function Step({ number, title, body }: { number: string; title: string; body: string }) {
  return (
    <div>
      <div className="w-8 h-8 rounded-full bg-[#1E3A8A] text-white text-sm font-medium flex items-center justify-center mb-3">
        {number}
      </div>
      <h3 className="font-medium mb-1.5">{title}</h3>
      <p className="text-sm text-neutral-500 leading-relaxed">{body}</p>
    </div>
  )
}
```

## src/app/globals.css

```css
@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #171717;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
}
```

## Notes on visual context
- Brand accent: `#FF6B4A` (orange-coral) — CTA button, underline accent bar.
- Secondary accent: `#1E3A8A` (deep blue) — step number badges.
- Background: `#FBFCFD` (near-white).
- Font: Arial/Helvetica system stack (Tailwind v4 theme also wires `--font-geist-sans`/`--font-geist-mono` via `@theme inline`, but body CSS overrides to Arial/Helvetica).
- Layout: centered single-column hero (max-w-3xl) with logo, headline, subheadline, single CTA; 3-column "steps" grid below (max-w-4xl); minimal header with language switcher + browse/login links; thin footer.
- `MapBackground` component renders behind everything (`absolute`/full-bleed likely) — its source wasn't uploaded, so exact visual isn't captured here.
