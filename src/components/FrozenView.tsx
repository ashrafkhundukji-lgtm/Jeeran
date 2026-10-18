'use client'

import SignOutButton from '@/components/SignOutButton'
import OwnerShell from '@/components/owner/OwnerShell'
import { BTN_PRIMARY, Card } from '@/components/owner/ui'
import { AlertIcon, WhatsAppIcon } from '@/components/customer/icons'
import { useLocale } from '@/lib/i18n/useLocale'
import { DASHBOARD_COPY } from '@/lib/i18n/dashboard'

// Shown instead of the dashboard while a shop is frozen. Re-skinned to the
// owner system; same content: what happened, the admin's reason (if any),
// and a way to reach support.
export default function FrozenView({
  reason,
  supportWhatsappUrl,
}: {
  reason: string | null
  supportWhatsappUrl: string | null
}) {
  const [locale] = useLocale()
  const copy = DASHBOARD_COPY[locale].frozen

  return (
    <OwnerShell tab={null}>
      <div className="flex min-h-[80dvh] flex-col items-center justify-center gap-5 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/design/jeeran-mark-navy.svg" alt="" width={40} height={40} className="h-10 w-10" />
        <span className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-brand-coral-tint text-brand-coral">
          <AlertIcon size={32} />
        </span>
        <div className="flex max-w-sm flex-col gap-2">
          <h1 className="font-display text-[26px] leading-tight font-bold text-brand-navy-deep">{copy.heading}</h1>
          <p className="text-[15px] leading-relaxed text-brand-muted">{copy.body}</p>
        </div>

        {reason && (
          <Card className="w-full max-w-sm p-4 text-start">
            <p className="mb-1 text-[13px] font-semibold text-brand-muted">{copy.reasonLabel}</p>
            <p dir="auto" className="text-[15px] leading-relaxed text-brand-navy-deep">
              {reason}
            </p>
          </Card>
        )}

        {/* Only rendered when NEXT_PUBLIC_SUPPORT_WHATSAPP is configured (see
            src/app/dashboard/frozen/page.tsx) — without it there's no
            actionable link, so the plain contact text stands alone. */}
        {supportWhatsappUrl ? (
          <a href={supportWhatsappUrl} target="_blank" rel="noopener noreferrer" className={`${BTN_PRIMARY} w-full max-w-sm`}>
            <WhatsAppIcon size={20} />
            {copy.whatsappCta}
          </a>
        ) : (
          <p className="text-[15px] text-brand-muted">{copy.contactSupport}</p>
        )}

        <SignOutButton className="min-h-11 rounded-xl px-4 text-[15px] font-semibold text-brand-muted" />
      </div>
    </OwnerShell>
  )
}
