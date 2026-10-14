import type { ReactNode } from 'react'

// Page shell for the customer screens: cream canvas, customer type pair,
// `dir` from the active locale, fluid on phones and a centered max-w-md
// column on wider screens. `blob` adds the soft coral radial in the top
// start corner; `clearance` reserves room for a fixed bottom bar (nav or
// the offer page's action bar) so content never sits under it.
export default function CustomerPage({
  dir,
  lang,
  blob = true,
  clearance = '',
  children,
}: {
  dir: 'rtl' | 'ltr'
  lang: string
  blob?: boolean
  clearance?: string
  children: ReactNode
}) {
  return (
    <main
      dir={dir}
      lang={lang}
      className={`relative min-h-dvh w-full overflow-x-clip bg-brand-cream font-body text-brand-navy-deep ${clearance}`}
    >
      {blob && (
        <div
          aria-hidden="true"
          className="bg-brand-blob pointer-events-none absolute -start-[110px] -top-[130px] h-[330px] w-[330px] rounded-full"
        />
      )}
      <div className="relative mx-auto w-full max-w-md">{children}</div>
    </main>
  )
}
