'use client'

import DashboardNav from '@/components/DashboardNav'
import ProfileForm from '@/components/ProfileForm'
import SignOutButton from '@/components/SignOutButton'
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
  const copy = DASHBOARD_COPY[locale].profile

  return (
    <main dir={dir} className="max-w-md mx-auto px-4 pt-10 pb-24 md:pb-10">
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
        phone={phone}
        whatsapp={whatsapp}
      />

      {/* Sign-out lives in the desktop pill nav (DashboardNav) already —
          the mobile bottom tab bar has no room/convention for a 5th
          "sign out" tab, so Profile is where a mobile customer finds it
          instead, same as most native apps put account actions here. */}
      <div className="mt-8 border-t border-neutral-200 pt-6 md:hidden">
        <SignOutButton />
      </div>
    </main>
  )
}
