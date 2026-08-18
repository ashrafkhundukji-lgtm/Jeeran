'use client'

import { useState } from 'react'

type Status = 'idle' | 'working' | 'error' | 'confirming'

const GEOLOCATION_TIMEOUT_MS = 5000

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
export default function AddToWalletMembershipButton({ businessId }: { businessId: string }) {
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [saveUrl, setSaveUrl] = useState('')

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
      }
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  if (status === 'confirming') {
    return (
      <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center">
        <p className="text-2xl mb-1">🎉</p>
        <p className="text-sm font-medium text-emerald-800 mb-1">You&apos;re in!</p>
        <p className="text-xs text-emerald-700 mb-3">
          Offers from shops near you will start showing up on your pass soon.
        </p>
        <button
          type="button"
          onClick={() => {
            window.location.href = saveUrl
          }}
          className="w-full rounded-lg bg-[#FF6B4A] text-white text-sm font-medium py-3 transition-colors hover:bg-[#e85a3b] active:opacity-80"
        >
          Continue to Google Wallet
        </button>
      </div>
    )
  }

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={handleClick}
        disabled={status === 'working'}
        className="w-full rounded-lg bg-[#FF6B4A] text-white text-sm font-medium py-3 transition-colors hover:bg-[#e85a3b] active:opacity-80 disabled:opacity-50"
      >
        {status === 'working' ? 'Saving…' : 'Add to Google Wallet'}
      </button>
      {status === 'error' && <p className="text-xs text-red-600 text-center mt-1.5">{error}</p>}
      <p className="text-xs text-neutral-400 text-center mt-2">
        Save once to get nearby Jeeran offers pushed to your wallet — no need to scan again.
      </p>
    </div>
  )
}
