'use client'

import { useState } from 'react'
import { useLocale } from '@/lib/i18n/useLocale'
import { CUSTOMER_UI_COPY } from '@/lib/i18n/customerUi'
import { CheckIcon, CloseIcon, SmartphoneIcon, TrashIcon, WalletIcon } from '@/components/customer/icons'
import { PRESS } from '@/components/customer/primitives'

type Status = 'idle' | 'working' | 'error' | 'confirming'

const GEOLOCATION_TIMEOUT_MS = 5000

// Google Wallet passes work fine without the app (confirmed live: saved a
// pass through the pure browser flow — sign in, tap Add, never touched a
// native app — then PATCHed it and watched the new content appear on
// wallet.google.com immediately). But the app-less path has a real gap:
// notifyNewOffer()'s lock-screen push (geo-notify.ts) has nowhere to land on
// a device with no Wallet app installed, so an app-less member's card stays
// correct in the background while they never hear about it. There's no
// signal to detect this — /api/wallet/membership/create's response is just
// {alreadyMember, saveUrl}, and saveUrl is a plain redirect to Google with
// no return callback (see the comment on handleClick below), so Google never
// tells us how — or whether — the save actually completed. Can't target the
// nudge, so it's shown to every new member instead of guessing.
const GOOGLE_WALLET_PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.google.android.apps.walletnfcrel'

// Resolves null on denial/timeout/unsupported rather than rejecting — the
// server falls back to the scanned business's own coordinates in that case,
// so a declined permission prompt still produces a usable pass.
function getBrowserLocation(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve(null)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: GEOLOCATION_TIMEOUT_MS, maximumAge: 0 },
    )
  })
}

// Single per-visit "join" action — unlike the per-campaign SaveToWalletButton,
// this isn't tied to any one offer: it creates (or reuses) the customer's
// persistent Jeeran Offers membership pass, which then gets pushed nearby
// offers server-side. See src/app/api/wallet/membership/create/route.ts.
//
// Visual refresh only (docs/design-reference/Scan.dc.html): renders the
// whole body of the scan page's overlapping card — intro, the large coral
// button and the trust row, or the first-scan confirmation. handleClick()
// is unchanged. `onConfirmed` just lets the page header show "visit
// recorded" once the create call has actually succeeded.
export default function AddToWalletMembershipButton({
  businessId,
  onConfirmed,
}: {
  businessId: string
  onConfirmed?: () => void
}) {
  const [locale] = useLocale()
  const copy = CUSTOMER_UI_COPY[locale].scan
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [saveUrl, setSaveUrl] = useState('')
  const [showAppNudge, setShowAppNudge] = useState(true)

  async function handleClick() {
    setStatus('working')
    setError('')

    try {
      const location = await getBrowserLocation()

      const res = await fetch('/api/wallet/membership/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, lat: location?.lat, lng: location?.lng }),
      })

      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(body.error || 'Could not create the wallet pass')
      }
      if (!body.saveUrl) {
        throw new Error('Your pass exists but has no save link yet — try again shortly')
      }

      // Returning members already know what this is — keep that path fast,
      // no extra beat. A brand-new member (alreadyMember: false) previously
      // went straight from tapping this button into Google's own "Add to
      // Wallet" system prompt with zero acknowledgment from us first — the
      // ONLY reliable place for a warm moment is here, before handing off:
      // once we navigate to saveUrl there's no guaranteed way back to our
      // page to show anything "after" (this is a plain redirect, not a
      // popup with a return callback).
      if (body.alreadyMember) {
        window.location.href = body.saveUrl
      } else {
        setSaveUrl(body.saveUrl)
        setStatus('confirming')
        onConfirmed?.()
      }
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  const bigButton = `flex h-[58px] w-full items-center justify-center gap-2.5 rounded-2xl bg-brand-coral font-display text-[19px] font-bold text-white shadow-brand-coral disabled:opacity-60 ${PRESS}`

  if (status === 'confirming') {
    return (
      <div className="flex flex-col gap-3.5">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-brand-tint text-brand-navy">
            <CheckIcon size={22} strokeWidth={2.4} />
          </span>
          <div className="flex flex-col gap-0.5">
            <span className="font-display text-base font-semibold text-brand-navy-deep">{copy.youreIn}</span>
            <span className="text-[13.5px] leading-normal text-brand-muted">{copy.youreInBody}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            window.location.href = saveUrl
          }}
          className={bigButton}
        >
          <WalletIcon size={22} />
          {copy.continueToWallet}
        </button>

        {/* Not a blocking requirement — the pass saves and works either way
            (see GOOGLE_WALLET_PLAY_STORE_URL comment above). Dismissible,
            shown to every new member since there's no reliable way to
            detect whether they already have the app. */}
        {showAppNudge && (
          <div className="relative rounded-2xl bg-brand-tint p-3 pe-10 text-start">
            <button
              type="button"
              onClick={() => setShowAppNudge(false)}
              aria-label={copy.dismiss}
              className="absolute end-0 top-0 flex h-11 w-11 items-center justify-center text-brand-muted"
            >
              <CloseIcon size={16} />
            </button>
            <p className="text-xs leading-relaxed text-brand-navy-deep">{copy.appNudge}</p>
            <a
              href={GOOGLE_WALLET_PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex min-h-[44px] items-center text-[13px] font-semibold text-brand-coral underline underline-offset-2"
            >
              {copy.getWalletApp}
            </a>
          </div>
        )}
      </div>
    )
  }

  const trust = [
    { Icon: CheckIcon, label: copy.trustFree },
    { Icon: SmartphoneIcon, label: copy.trustNoApp },
    { Icon: TrashIcon, label: copy.trustRemove },
  ]

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-brand-coral-tint text-brand-coral">
          <WalletIcon size={22} />
        </span>
        <div className="flex flex-col gap-0.5">
          <span className="font-display text-base font-semibold text-brand-navy-deep">{copy.cardTitle}</span>
          <span className="text-[13.5px] leading-normal text-brand-muted">{copy.cardBody}</span>
        </div>
      </div>

      <button type="button" onClick={handleClick} disabled={status === 'working'} aria-busy={status === 'working'} className={bigButton}>
        {status === 'working' ? (
          <span aria-hidden="true" className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none" />
        ) : (
          <WalletIcon size={22} />
        )}
        {status === 'working' ? copy.saving : copy.addToWallet}
      </button>

      {status === 'error' && (
        <p role="alert" className="rounded-xl bg-brand-coral-tint px-3 py-2 text-center text-[13px] font-medium text-brand-coral">
          {copy.genericError}
          {/* Server detail kept for support, visually secondary. */}
          {error && <span className="sr-only"> ({error})</span>}
        </p>
      )}

      <div className="flex items-center justify-between gap-2 text-[12.5px] font-semibold text-brand-muted">
        {trust.map(({ Icon, label }) => (
          <span key={label} className="flex items-center gap-1">
            <Icon size={14} strokeWidth={2.2} className="text-brand-navy" />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
