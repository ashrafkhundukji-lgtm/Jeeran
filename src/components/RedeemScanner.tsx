'use client'

import { useEffect, useRef, useState } from 'react'
import DashboardNav from '@/components/DashboardNav'
import { useLocale } from '@/lib/i18n/useLocale'
import { getDir } from '@/lib/i18n/locale'
import { DASHBOARD_COPY, type DashboardCopy } from '@/lib/i18n/dashboard'

// BarcodeDetector isn't in TS's default DOM lib (still an experimental Web
// API, unsupported in Safari/iOS — see the manual-entry fallback below,
// which exists specifically because of that gap, not as a lesser backup).
interface DetectedBarcode {
  rawValue: string
}
interface BarcodeDetectorInstance {
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>
}
interface BarcodeDetectorConstructor {
  new (options?: { formats: string[] }): BarcodeDetectorInstance
}
declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorConstructor
  }
}

type RedeemResult =
  | { kind: 'success'; title: string; description: string | null }
  | { kind: 'error'; message: string }

// Maps /api/redeem's own distinct error strings to localized copy, rather
// than collapsing everything into one generic failure message — staff need
// to know WHY a scan didn't work (no offer live right now vs. already
// claimed vs. a dead pass vs. a corrupted code are all different actions).
function errorCopyFor(rawError: string, copy: DashboardCopy['redeem']): string {
  switch (rawError) {
    case 'no active offer for this shop':
      return copy.errorNoActiveOffer
    case 'already redeemed by this customer':
      return copy.errorAlreadyRedeemed
    case 'pass no longer active':
      return copy.errorPassInactive
    case 'invalid or tampered barcode':
      return copy.errorInvalidBarcode
    default:
      return `${copy.errorGeneric}${rawError ? ` (${rawError})` : ''}`
  }
}

export default function RedeemScanner() {
  const [locale] = useLocale()
  const dir = getDir(locale)
  const copy = DASHBOARD_COPY[locale].redeem

  const [cameraSupported, setCameraSupported] = useState<boolean | null>(null) // null until checked client-side, matches useLocale's post-mount check pattern
  const [scanning, setScanning] = useState(false)
  const [checking, setChecking] = useState(false)
  const [manualValue, setManualValue] = useState('')
  const [result, setResult] = useState<RedeemResult | null>(null)
  const [cameraError, setCameraError] = useState('')

  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    setCameraSupported(typeof window !== 'undefined' && 'BarcodeDetector' in window)
  }, [])

  // Camera scan loop — only runs while `scanning` is true, torn down on
  // every stop (including an in-flight redeem check or unmount) so the
  // camera stream and detection loop never outlive the page.
  useEffect(() => {
    if (!scanning) return
    if (typeof window === 'undefined' || !window.BarcodeDetector) return

    let stream: MediaStream | null = null
    let rafId = 0
    let stopped = false

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        const video = videoRef.current
        if (!video) return
        video.srcObject = stream
        await video.play()

        const detector = new window.BarcodeDetector!({ formats: ['qr_code'] })

        const tick = async () => {
          if (stopped || !videoRef.current) return
          try {
            const codes = await detector.detect(videoRef.current)
            if (codes.length > 0 && !stopped) {
              stopped = true
              handleDecoded(codes[0].rawValue)
              return
            }
          } catch {
            // Transient per-frame detect failures (e.g. a frame mid-decode) —
            // just keep looping rather than surfacing every one.
          }
          rafId = requestAnimationFrame(tick)
        }
        rafId = requestAnimationFrame(tick)
      } catch {
        setCameraError('camera')
        setScanning(false)
      }
    }
    start()

    return () => {
      stopped = true
      cancelAnimationFrame(rafId)
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [scanning])

  async function handleDecoded(barcodeValue: string) {
    setScanning(false)
    setChecking(true)
    setResult(null)

    try {
      const res = await fetch('/api/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcodeValue }),
      })
      const body = await res.json().catch(() => ({}))

      if (res.ok && body.ok) {
        setResult({ kind: 'success', title: body.offer?.title ?? '', description: body.offer?.description ?? null })
      } else {
        setResult({ kind: 'error', message: body.error ?? '' })
      }
    } catch {
      setResult({ kind: 'error', message: '' })
    } finally {
      setChecking(false)
    }
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    const value = manualValue.trim()
    if (!value || checking) return
    handleDecoded(value)
  }

  function reset() {
    setResult(null)
    setManualValue('')
    setCameraError('')
  }

  return (
    <main dir={dir} className="max-w-lg mx-auto px-4 py-10">
      <DashboardNav />

      <h1 className="text-xl font-semibold mb-1">{copy.heading}</h1>
      <p className="text-sm text-neutral-500 mb-6">{copy.subtitle}</p>

      {result ? (
        <div
          className={`rounded-xl p-6 text-center ${
            result.kind === 'success' ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'
          }`}
        >
          <div className="text-4xl mb-2">{result.kind === 'success' ? '✓' : '✕'}</div>
          {result.kind === 'success' ? (
            <>
              <p className="text-emerald-800 font-medium">{copy.resultSuccess.replace('{title}', result.title)}</p>
              {result.description && <p className="text-sm text-emerald-700 mt-1">{result.description}</p>}
            </>
          ) : (
            <p className="text-red-700 font-medium">{errorCopyFor(result.message, copy)}</p>
          )}
          <button
            onClick={reset}
            className="mt-4 bg-[#FF6B4A] text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors hover:bg-[#e85a3b]"
          >
            {copy.scanAnother}
          </button>
        </div>
      ) : (
        <>
          {/* Camera scan — primary method, only rendered where BarcodeDetector
              actually exists. cameraSupported starts null (checked post-mount,
              same reason useLocale reads localStorage post-mount) so we don't
              flash the unsupported message before the check runs. */}
          {cameraSupported && (
            <div className="mb-6">
              {scanning ? (
                <div className="relative rounded-xl overflow-hidden bg-black aspect-square">
                  <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                  <div className="absolute inset-0 border-4 border-white/40 m-8 rounded-lg pointer-events-none" />
                  {checking && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-sm">
                      {copy.checking}
                    </div>
                  )}
                  <button
                    onClick={() => setScanning(false)}
                    className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/90 text-[#1a1a1a] text-sm font-medium rounded-lg px-4 py-2"
                  >
                    {copy.stopScan}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setCameraError('')
                    setScanning(true)
                  }}
                  disabled={checking}
                  className="w-full bg-[#FF6B4A] text-white text-sm font-medium rounded-lg py-3 transition-colors hover:bg-[#e85a3b] disabled:opacity-50"
                >
                  {copy.startScan}
                </button>
              )}
              {cameraError && <p className="text-xs text-red-600 text-center mt-2">{copy.cameraStartFailed}</p>}
            </div>
          )}

          {cameraSupported === false && (
            <p className="text-xs text-neutral-500 mb-4 text-center">{copy.cameraUnsupported}</p>
          )}

          {/* Manual entry — always available, not just when the camera is
              unsupported. Required so Safari/iOS shops (no BarcodeDetector)
              aren't locked out, and as a fallback for bad lighting/damaged
              cameras even where the camera path works. */}
          <form onSubmit={handleManualSubmit} className="border border-neutral-200 rounded-xl p-4">
            <p className="text-sm font-medium mb-2">{copy.manualHeading}</p>
            <div className="flex gap-2">
              <input
                value={manualValue}
                onChange={(e) => setManualValue(e.target.value)}
                placeholder={copy.manualPlaceholder}
                disabled={checking}
                className="flex-1 border border-neutral-300 rounded-lg px-3 py-2 text-sm disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={checking || !manualValue.trim()}
                className="bg-[#1E3A8A] text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors hover:bg-[#1E3A8A]/90 disabled:opacity-50"
              >
                {checking ? copy.checking : copy.manualSubmit}
              </button>
            </div>
          </form>
        </>
      )}
    </main>
  )
}
