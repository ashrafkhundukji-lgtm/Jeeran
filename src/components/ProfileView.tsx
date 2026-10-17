'use client'

import OwnerShell, { OwnerTopBar } from '@/components/owner/OwnerShell'
import ShopIdentity from '@/components/owner/ShopIdentity'
import ProfileForm from '@/components/ProfileForm'
import { useLocale } from '@/lib/i18n/useLocale'
import { DASHBOARD_COPY } from '@/lib/i18n/dashboard'

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

  return (
    <OwnerShell
      tab="profile"
      header={<OwnerTopBar variant="subpage" title={copy.profile.heading} backHref="/dashboard/owner" backLabel={copy.common.back} />}
    >
      <div className="flex flex-col gap-6">
        <ShopIdentity businessId={businessId} businessName={businessName} category={category} initialLogo={logoUrl} initialCover={coverUrl} />
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
