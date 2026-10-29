import type { Locale } from '@/lib/i18n/locale'
import { WALLET_HOME_COPY } from '@/lib/i18n/walletHome'

// Wordmark for the Home tab. It used to carry a "Turn on location" chip that
// only asked the browser for permission and never saved anything; the
// member's saved location is changed from the radius/location settings
// section instead.
export default function AppHeader({ locale }: { locale: Locale }) {
  return (
    <header className="flex min-h-11 items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/design/jeeran-mark-navy.svg" alt="" className="h-[34px] w-[34px]" />
      <span className="font-display text-[22px] font-bold text-brand-navy-deep">{WALLET_HOME_COPY[locale].brand}</span>
    </header>
  )
}
