'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import SiteLogo from '@/components/SiteLogo'

function ValidateInner() {
  const searchParams = useSearchParams()
  const claim = searchParams.get('claim') || ''
  const hash = searchParams.get('hash') || ''

  const [status, setStatus] = useState<'idle' | 'working' | 'success' | 'error'>('idle')
  const [result, setResult] = useState<{ title?: string; error?: string }>({})

  async function handleConfirm() {
    setStatus('working')
    const res = await fetch('/api/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ claim, hash }),
    })
    const body = await res.json().catch(() => ({}))

    if (!res.ok) {
      setStatus('error')
      setResult({ error: body.error || 'Could not validate this coupon' })
      return
    }

    setStatus('success')
    setResult({ title: body.title })
  }

  if (!claim || !hash) {
    return (
      <div className="max-w-sm mx-auto mt-24 px-4 text-center">
        <div className="flex justify-center mb-6">
          <SiteLogo className="h-14" />
        </div>
        <p className="text-red-600 text-sm">Missing or malformed link.</p>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-emerald-600 flex flex-col items-center justify-center text-white text-center px-6">
        <div className="text-6xl mb-4">✓</div>
        <h1 className="text-2xl font-bold mb-2">قسيمة صالحة</h1>
        <p className="text-lg">{result.title}</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-red-600 flex flex-col items-center justify-center text-white text-center px-6">
        <div className="text-6xl mb-4">✕</div>
        <h1 className="text-2xl font-bold mb-2">Invalid coupon</h1>
        <p className="text-lg">{result.error}</p>
      </div>
    )
  }

  return (
    <div className="max-w-sm mx-auto mt-24 px-4 text-center">
      <div className="flex justify-center mb-6">
        <SiteLogo className="h-14" />
      </div>
      <p className="text-sm text-neutral-600 mb-6">
        Confirm this customer&apos;s wallet coupon to mark it redeemed.
      </p>
      <button
        onClick={handleConfirm}
        disabled={status === 'working'}
        className="bg-[#FF6B4A] text-white rounded-lg px-6 py-3 text-sm font-medium transition-colors hover:bg-[#e85a3b] disabled:opacity-50"
      >
        {status === 'working' ? 'Checking…' : 'Confirm redemption'}
      </button>
    </div>
  )
}

export default function ValidatePage() {
  return (
    <Suspense>
      <ValidateInner />
    </Suspense>
  )
}
