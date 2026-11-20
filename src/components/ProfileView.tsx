'use client'

import OwnerShell, { OwnerTopBar } from '@/components/owner/OwnerShell'
import ShopIdentity from '@/components/owner/ShopIdentity'
import ProfileForm from '@/components/ProfileForm'
import { useLocale } from '@/lib/i18n/useLocale'
import { DASHBOARD_COPY } from '@/lib/i18n/dashboard'
import { OWNER_APP_COPY } from '@/lib/i18n/ownerApp'
import { BellIcon, ChevronForwardIcon } from '@/components/customer/icons'
import { PRESS } from '@/components/customer/primitives'

// Profile page shell: shop identity (logo/cover — saved immediately on
// upload) on top, then the grouped profile form with its own dirty-state
// save bar.
export default function ProfileView({
  businessId,
  email,
  fullName,
  businessName,
  category,
  latitude,
  longitude,
  phone,
  whatsapp,
  logoUrl,
  coverUrl,
}: {
  businessId: string
  email: string
  fullName: string
  businessName: string
  category: string
  latitude: number | null
  longitude: number | null
  phone: string | null
  whatsapp: string | null
  logoUrl: string | null
  coverUrl: string | null
}) {
  const [locale] = useLocale()
  const copy = DASHBOARD_COPY[locale]
  const notif = OWNER_APP_COPY[locale].settings

  return (
    <OwnerShell
      tab="profile"
      header={<OwnerTopBar variant="subpage" title={copy.profile.heading} backHref="/dashboard/owner" backLabel={copy.common.back} />}
    >
      <div className="flex flex-col gap-6">
        <ShopIdentity businessId={businessId} businessName={businessName} category={category} initialLogo={logoUrl} initialCover={coverUrl} />
        <a
          href="/dashboard/notifications"
          className={`flex min-h-16 items-center gap-3 rounded-[22px] border border-brand-line bg-white px-4 py-3 ${PRESS}`}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-tint text-brand-navy">
            <BellIcon size={20} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-semibold">{notif.linkLabel}</span>
            <span className="block text-[13px] text-brand-muted">{notif.linkHint}</span>
          </span>
          <ChevronForwardIcon size={20} className="shrink-0 text-brand-muted" />
        </a>
        <div>
          <ProfileForm
            email={email}
            fullName={fullName}
            businessName={businessName}
            category={category}
            latitude={latitude}
            longitude={longitude}
            phone={phone}
            whatsapp={whatsapp}
          />
        </div>
        {/* Room for the save bar so the last card is never hidden under it. */}
        <div className="h-16" aria-hidden="true" />
      </div>
    </OwnerShell>
  )
}
