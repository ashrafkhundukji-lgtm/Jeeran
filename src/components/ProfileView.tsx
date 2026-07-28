'use client'

import DashboardNav from '@/components/DashboardNav'
import ProfileForm from '@/components/ProfileForm'
import { useLocale } from '@/lib/i18n/useLocale'
import { getDir } from '@/lib/i18n/locale'
import { DASHBOARD_COPY } from '@/lib/i18n/dashboard'

export default function ProfileView({
  email,
  fullName,
  businessName,
  category,
  latitude,
  longitude,
}: {
  email: string
  fullName: string
  businessName: string
  category: string
  latitude: number | null
  longitude: number | null
}) {
  const [locale] = useLocale()
  const dir = getDir(locale)
  const copy = DASHBOARD_COPY[locale].profile

  return (
    <main dir={dir} className="max-w-md mx-auto px-4 py-10">
      <DashboardNav />

      <h1 className="text-xl font-semibold mb-1">{copy.heading}</h1>
      <p className="text-sm text-neutral-500 mb-6">{copy.subtitle}</p>

      <ProfileForm
        email={email}
        fullName={fullName}
        businessName={businessName}
        category={category}
        latitude={latitude}
        longitude={longitude}
      />
    </main>
  )
}
