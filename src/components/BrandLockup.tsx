import type { Locale } from '@/lib/i18n/locale'

// Mark + wordmark, linked home. The mark is the real app file
// (public/design/jeeran-mark-white.svg on navy/photo, -navy.svg on cream);
// the wordmark is the name in the page language with the other script as
// a small second line, as in the approved landing/auth mockups.
const NAMES: Record<Locale, [string, string]> = {
  ar: ['جيران', 'Jeeran'],
  en: ['Jeeran', 'جيران'],
  ur: ['جیران', 'Jeeran'],
}

export default function BrandLockup({
  locale,
  tone = 'light',
  href = '/',
}: {
  locale: Locale
  // 'dark' = white on navy or on the photo; 'light' = navy on cream.
  tone?: 'light' | 'dark'
  href?: string | null
}) {
  const [name, second] = NAMES[locale]
  const body = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={tone === 'dark' ? '/design/jeeran-mark-white.svg' : '/design/jeeran-mark-navy.svg'}
        alt=""
        width={34}
        height={34}
        className="h-[34px] w-[34px] flex-none"
      />
      <span className="flex flex-col leading-tight">
        <span className={`font-display text-xl font-bold ${tone === 'dark' ? 'text-white' : 'text-brand-navy'}`}>{name}</span>
        <span className={`text-[11px] font-medium ${tone === 'dark' ? 'text-white/80' : 'text-brand-muted'}`}>{second}</span>
      </span>
    </>
  )

  if (!href) return <span className="flex items-center gap-2.5">{body}</span>
  return (
    <a
      href={href}
      aria-label={name}
      className={`flex min-h-11 items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 ${
        tone === 'dark' ? 'focus-visible:outline-white' : 'focus-visible:outline-brand-navy'
      }`}
    >
      {body}
    </a>
  )
}
