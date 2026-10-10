'use client'

import { useEffect } from 'react'
import { useLocale } from '@/lib/i18n/useLocale'
import { detectDeviceLocale, type Locale } from '@/lib/i18n/locale'

// Makes the wallet mini-site's own text follow the language the member
// picked on the Language tab (wallet_members.preferred_language). Without
// this, that choice only ever changed the Google Wallet CARD — every page
// here reads useLocale()'s localStorage value instead, which nothing in the
// wallet flow set, so the site always stayed in its Arabic default no matter
// what the customer chose. `null` ("Automatic") follows the phone's language.
// Rendered by each wallet page's server component, which already has the
// member row; every other useLocale() on the page picks the change up via
// its change event.
export default function WalletLocaleSync({ preferred }: { preferred: Locale | null }) {
  const [, setLocale] = useLocale()

  useEffect(() => {
    // Always set, rather than comparing first: useLocale()'s own state is
    // still the 'ar' default during this first effect (it reads
    // localStorage in an effect too), so a comparison could wrongly skip.
    setLocale(preferred ?? detectDeviceLocale())
    // Only re-sync when the saved preference itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferred])

  return null
}
