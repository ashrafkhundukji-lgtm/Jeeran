import type { ReactNode } from 'react'
import { ChevronForwardIcon } from './icons'
import { PRESS, ShopAvatar } from './primitives'

// One shop as a single tap target: avatar (logo or letter), name, a meta
// line, an optional detail line, and a trailing cue (chevron by default).
// Shared by /wallet/shops (NearbyShopsView) and /browse (BrowseView).
// Fixed avatar size and a min height keep rows from shifting while logos
// load and keep grid rows even. Without `href` (nothing to open) the same
// row renders as a plain block instead of a link.
export default function ShopRow({
  href,
  name,
  logoUrl,
  meta,
  detail,
  trailing,
  external = false,
}: {
  href?: string | null
  name: string
  logoUrl?: string | null
  meta: ReactNode
  detail?: ReactNode
  trailing?: ReactNode
  // Off-site link (e.g. Google Maps directions): new tab, no referrer.
  external?: boolean
}) {
  const body = (
    <>
      <ShopAvatar name={name} logoUrl={logoUrl} size={48} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="min-w-0 text-start text-[15px] font-bold text-brand-navy-deep">
          <bdi dir="auto" className="inline-block max-w-full truncate align-bottom">
            {name}
          </bdi>
        </span>
        <span className="text-[12.5px] text-brand-muted">{meta}</span>
        {detail}
      </div>
      {href && (trailing ?? <ChevronForwardIcon size={20} strokeWidth={2.2} className="flex-none text-brand-muted" />)}
    </>
  )
  const box = 'flex h-full min-h-[78px] items-center gap-3 rounded-[18px] border border-brand-line bg-white p-3.5'

  if (!href) return <div className={box}>{body}</div>
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className={`${box} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-navy ${PRESS}`}
    >
      {body}
    </a>
  )
}
