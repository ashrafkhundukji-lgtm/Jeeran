'use client'

import SignOutButton from '@/components/SignOutButton'
import { useLocale } from '@/lib/i18n/useLocale'
import { getDir } from '@/lib/i18n/locale'
import { DASHBOARD_COPY } from '@/lib/i18n/dashboard'

export default function FrozenView({
  reason,
  supportWhatsappUrl,
}: {
  reason: string | null
  supportWhatsappUrl: string | null
}) {
  const [locale] = useLocale()
  const dir = getDir(locale)
  const copy = DASHBOARD_COPY[locale].frozen

  return (
    <main dir={dir} className="flex min-h-dvh flex-col items-center justify-center px-[22px] py-[26px] text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/design/jeeran-mark.svg" alt="Jeeran" className="mb-7 h-[38px] w-[38px] opacity-90" />

      <div className="mb-[18px] flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-[#FEF3C7]">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
      </div>

      <h1 className="mb-2.5 text-[27px] font-black leading-[1.2] tracking-[-0.01em]">{copy.heading}</h1>
      <p className="mb-5 max-w-xs text-[15px] leading-[1.65] text-[#5a5a5a]">{copy.body}</p>

      {reason && (
        <div className="mb-[26px] w-full max-w-xs rounded-2xl border border-[#ececec] bg-white p-[15px_16px] text-start">
          <p className="mb-1.5 text-[11.5px] font-semibold tracking-[0.06em] text-[#a3a3a3]">{copy.reasonLabel}</p>
          <p className="text-[14px] leading-[1.6] text-[#1a1a1a]">{reason}</p>
        </div>
      )}

      {/* Only rendered when NEXT_PUBLIC_SUPPORT_WHATSAPP is configured (see
          src/app/dashboard/frozen/page.tsx) — without it there's no actionable
          link, so the plain contact text below stands alone instead. */}
      {supportWhatsappUrl ? (
        <a
          href={supportWhatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-[10px] flex w-full max-w-xs items-center justify-center gap-[9px] rounded-[15px] bg-[#25D366] px-4 py-4 text-[15.5px] font-semibold text-white transition-colors hover:brightness-95"
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
          </svg>
          {copy.whatsappCta}
        </a>
      ) : (
        <p className="mb-8 text-[14px] text-[#8a8a8a]">{copy.contactSupport}</p>
      )}

      <SignOutButton className="py-[13px] text-[14.5px] font-medium text-[#8a8a8a]" />
    </main>
  )
}
