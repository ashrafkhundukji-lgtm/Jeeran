'use client'

import { useEffect, useState } from 'react'
import { useLocale } from '@/lib/i18n/useLocale'
import { LOCALE_STORAGE_KEY, detectDeviceLocale, getDir, isLocale } from '@/lib/i18n/locale'
import { CUSTOMER_UI_COPY } from '@/lib/i18n/customerUi'
import { WALLET_HOME_COPY } from '@/lib/i18n/walletHome'
import CustomerPage from '@/components/customer/CustomerPage'
import OfferCard, { type CardOffer } from '@/components/customer/OfferCard'
import AddToWalletMembershipButton from '@/components/AddToWalletMembershipButton'
import { CheckIcon, StoreIcon } from '@/components/customer/icons'
import { EmptyState, NoOffersState } from '@/components/customer/States'

// QR scan landing (artboard Scan.dc.html). The Google Wallet button is the
// platform's #1 conversion, so it's the biggest thing on the page, inside
// the white card overlapping the navy header. AddToWalletMembershipButton
// is rendered exactly once and keeps all of its own behavior (geolocation
// request on every tap, membership create, first-scan confirmation,
// returning-member redirect) — this file only lays it out.
//
// The "visit recorded" chip only appears once that create call has
// succeeded: loading this page records nothing by itself, so showing it
// up front would be untrue.
export default function ScanView({
  hostId,
  hostName,
  offers,
  frozen = false,
}: {
  hostId: string
  hostName: string
  offers: CardOffer[]
  frozen?: boolean
}) {
  const [locale, setLocale] = useLocale()

  // The scan page is usually a customer's first contact with Jeeran, so
  // there's often no saved language yet — and the site-wide default is
  // Arabic. Follow the phone's language in that case. A language already
  // chosen on this device (landing page, Language tab) is left alone.
  useEffect(() => {
    if (!isLocale(localStorage.getItem(LOCALE_STORAGE_KEY))) setLocale(detectDeviceLocale())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const dir = getDir(locale)
  const copy = CUSTOMER_UI_COPY[locale]
  const [visitRecorded, setVisitRecorded] = useState(false)

  return (
    <CustomerPage dir={dir} lang={locale} blob={false} clearance="pb-10">
      <header className="bg-brand-hero relative flex flex-col gap-3 overflow-hidden px-6 pt-5 pb-24 text-white">
        <div aria-hidden="true" className="bg-brand-dot-grid absolute inset-0" />
        <div aria-hidden="true" className="absolute -start-[60px] -top-[60px] h-[200px] w-[200px] rounded-full bg-white/7" />
        {/* White-alpha circles only on navy — translucent coral reads as mauve. */}
        <div aria-hidden="true" className="absolute -end-[50px] -bottom-[30px] h-[180px] w-[180px] rounded-full bg-white/6" />

        <div className="relative mb-2.5 flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/design/jeeran-mark-white.svg" alt="" className="h-[34px] w-[34px]" />
          <span className="font-display text-[22px] font-bold">{WALLET_HOME_COPY[locale].brand}</span>
        </div>

        {visitRecorded && (
          <span role="status" className="relative flex items-center gap-1.5 self-start rounded-full bg-white/16 px-3 py-1.5 text-[13px] font-semibold">
            <CheckIcon size={16} strokeWidth={2.4} />
            {copy.scan.visitRecorded}
          </span>
        )}

        <h1 className="relative font-display text-[30px] leading-[1.25] font-bold text-balance">{copy.scan.welcome}</h1>
        {!frozen && <p className="relative text-base leading-normal text-pretty text-white/88">{copy.scan.atShop(hostName)}</p>}
      </header>

      <div className="relative mx-6 -mt-[62px] rounded-3xl bg-white p-5 shadow-brand-overlap">
        {frozen ? (
          <EmptyState icon={<StoreIcon size={28} />} title={copy.scan.unavailable} />
        ) : (
          <AddToWalletMembershipButton businessId={hostId} onConfirmed={() => setVisitRecorded(true)} />
        )}
      </div>

      {!frozen && (
        <section className="relative flex flex-col gap-3 px-6 pt-[22px]">
          <h2 className="font-display text-lg font-semibold text-balance text-brand-navy-deep">{copy.scan.offersFrom(hostName)}</h2>
          {offers.length === 0 ? (
            <NoOffersState locale={locale} />
          ) : (
            offers.map((o) => <OfferCard key={o.id} offer={o} variant="row" locale={locale} />)
          )}
        </section>
      )}
    </CustomerPage>
  )
}
