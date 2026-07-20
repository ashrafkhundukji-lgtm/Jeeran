'use client'

import { useState } from 'react'

type Status = 'idle' | 'working' | 'done' | 'error'

// Apple-only one-off pass, per campaign — the Google side of this button was
// retired in favor of AddToWalletMembershipButton (one persistent "Jeeran
// Offers" pass per customer, not per campaign; see
// src/app/api/wallet/membership/create/route.ts). Apple has no membership-
// pass equivalent yet, so its one-off flow stays as-is (soft cutover).
//
// "Success" here means: pass generated, save flow triggered, and the credit
// ledger transaction logged. It's an optimistic claim, not a confirmed
// wallet add — Apple's actual add-confirmation signal (PassKit Web Service
// device registration) isn't wired up yet, which wasn't part of this
// sprint's scope.
export default function SaveToWalletButton({
  campaignId,
  hostBusinessId,
}: {
  campaignId: string
  hostBusinessId: string
}) {
  const [appleStatus, setAppleStatus] = useState<Status>('idle')
  const [appleError, setAppleError] = useState('')

  async function logClaim(claimToken: string) {
    const res = await fetch('/api/wallet/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaign_id: campaignId, host_business_id: hostBusinessId, claim_token: claimToken }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error || 'Pass saved, but the credit transfer failed to log')
    }
  }

  async function handleAppleClick() {
    setAppleStatus('working')
    setAppleError('')

    try {
      const generateRes = await fetch('/api/wallet/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign_id: campaignId, host_business_id: hostBusinessId }),
      })

      if (!generateRes.ok) {
        const body = await generateRes.json().catch(() => ({}))
        throw new Error(body.error || 'Could not generate the wallet pass')
      }

      const claimToken = generateRes.headers.get('X-Jeeran-Claim-Token')
      if (!claimToken) {
        throw new Error('Wallet pass was generated without a claim token')
      }

      const blob = await generateRes.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${campaignId}.pkpass`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)

      await logClaim(claimToken)
      setAppleStatus('done')
    } catch (err) {
      setAppleStatus('error')
      setAppleError(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleAppleClick}
        disabled={appleStatus === 'working' || appleStatus === 'done'}
        className="w-full rounded-lg border border-neutral-300 text-neutral-900 text-sm font-medium py-2.5 active:opacity-80 transition-opacity disabled:opacity-50"
      >
        {appleStatus === 'working'
          ? 'Saving…'
          : appleStatus === 'done'
            ? 'Saved to Apple Wallet'
            : 'Add to Apple Wallet'}
      </button>
      {appleStatus === 'error' && <p className="text-xs text-red-600 text-center mt-1.5">{appleError}</p>}
    </div>
  )
}
