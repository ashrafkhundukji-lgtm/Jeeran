'use client'

import DashboardNav from '@/components/DashboardNav'
import ProfileForm from '@/components/ProfileForm'
import { useLocale } from '@/lib/i18n/useLocale'
import { getDir } from '@/lib/i18n/locale'

// Thin wrapper: ProfileForm owns the OwnerAppBar (its trailing "Save" action
// needs the form's own dirty/loading state — see that component) and the
// sign-out card, so there's nothing else to render here beyond the page
// shell and the bottom tab bar.
export default function ProfileView({
  email,
  fullName,
  businessName,
  category,
  latitude,
  longitude,
  phone,
  whatsapp,
}: {
  email: string
  fullName: string
  businessName: string
  category: string
  latitude: number | null
  longitude: number | null
  phone: string | null
  whatsapp: string | null
}) {
  const [locale] = useLocale()
  const dir = getDir(locale)

  return (
    <main dir={dir} className="min-h-screen bg-[#FBFCFD] pb-24 md:pb-10">
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
      <DashboardNav />
    </main>
  )
}
