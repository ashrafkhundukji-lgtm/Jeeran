'use client'

import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import { useLocale } from '@/lib/i18n/useLocale'
import { getDir } from '@/lib/i18n/locale'
import { DASHBOARD_COPY, type DashboardCopy } from '@/lib/i18n/dashboard'

// BarcodeDetector isn't in TS's default DOM lib (still an experimental Web
// API). Used when present (cheaper — decodes off the video element
// directly), but it's an optimization now, not a hard requirement: when
// it's missing (Safari/iOS has no BarcodeDetector at all) the scan loop
// below falls back to grabbing video frames onto a canvas and decoding them
// with jsQR instead. getUserMedia — which Safari DOES support — is the only
// real gate on whether camera scanning is offered at all; manual entry
// remains available unconditionally either way.
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

// Torch (flashlight) is also a non-standard MediaTrackCapabilities/
// MediaTrackConstraintSet extension — not in TS's lib.dom.d.ts either.
interface TorchCapabilities {
  torch?: boolean
}

type RedeemResult =
  | {
      kind: 'success'
      title: string
      description: string | null
      // Best-effort context from /api/redeem (design_handoff_jeeran_mobile/
      // README.md §3) — null when the count query itself failed server-side,
      // in which case the corresponding context-card row is omitted rather
      // than showing a misleading zero.
      isNewCustomer: boolean | null
      redemptionsToday: number | null
    }
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
  const [torchSupported, setTorchSupported] = useState(false)
  const [torchOn, setTorchOn] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null) // off-screen — only used to grab frames for the jsQR fallback path, never rendered
  const trackRef = useRef<MediaStreamTrack | null>(null) // the active camera track, kept only for the torch toggle below

  useEffect(() => {
    setCameraSupported(typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia)
  }, [])

  // Camera scan loop — only runs while `scanning` is true, torn down on
  // every stop (including an in-flight redeem check or unmount) so the
  // camera stream and detection loop never outlive the page. Unchanged from
  // the pre-redesign version — the mobile redesign is a pure presentation
  // change to this component (design_handoff_jeeran_mobile/README.md §2),
  // aside from the added torch wiring.
  useEffect(() => {
    if (!scanning) return
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return

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

        const track = stream.getVideoTracks()[0] ?? null
        trackRef.current = track
        const capabilities = track?.getCapabilities?.() as (MediaTrackCapabilities & TorchCapabilities) | undefined
        setTorchSupported(!!capabilities?.torch)

        const detector = window.BarcodeDetector ? new window.BarcodeDetector({ formats: ['qr_code'] }) : null
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d', { willReadFrequently: true }) ?? null

        const tick = async () => {
          if (stopped || !videoRef.current) return
          try {
            let rawValue: string | null = null

            if (detector) {
              const codes = await detector.detect(videoRef.current)
              rawValue = codes[0]?.rawValue ?? null
            } else if (canvas && ctx && video.videoWidth > 0) {
              // Safari/iOS path: no BarcodeDetector, so decode a captured
              // frame ourselves. Sized to the video's actual resolution each
              // tick since it can change after the stream starts.
              canvas.width = video.videoWidth
              canvas.height = video.videoHeight
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
              const frame = ctx.getImageData(0, 0, canvas.width, canvas.height)
              rawValue = jsQR(frame.data, frame.width, frame.height, { inversionAttempts: 'dontInvert' })?.data ?? null
            }

            if (rawValue && !stopped) {
              stopped = true
              handleDecoded(rawValue)
              return
            }
          } catch {
            // Transient per-frame decode failures (e.g. a frame mid-decode) —
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
      trackRef.current = null
      setTorchSupported(false)
      setTorchOn(false)
    }
  }, [scanning])

  async function toggleTorch() {
    const track = trackRef.current
    if (!track) return
    try {
      // `advanced`/`torch` aren't in TS's MediaTrackConstraintSet — this is a
      // real but non-standardized capability some Android Chrome builds
      // expose; iOS Safari never reports torchSupported=true so this path
      // just isn't reached there.
      await track.applyConstraints({ advanced: [{ torch: !torchOn } as MediaTrackConstraintSet & TorchCapabilities] })
      setTorchOn((v) => !v)
    } catch {
      // Some browsers report the capability but reject the constraint at
      // runtime — leave torchOn as-is rather than lying about the state.
    }
  }

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
        setResult({
          kind: 'success',
          title: body.offer?.title ?? '',
          description: body.offer?.description ?? null,
          isNewCustomer: typeof body.isNewCustomer === 'boolean' ? body.isNewCustomer : null,
          redemptionsToday: typeof body.redemptionsToday === 'number' ? body.redemptionsToday : null,
        })
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
    <div dir={dir} className="relative min-h-dvh overflow-hidden bg-[#111] text-white">
      {scanning && (
        <>
          <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" playsInline muted />
          <canvas ref={canvasRef} className="hidden" />
        </>
      )}
      {checking && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60">
          <p className="text-[14px] text-white">{copy.checking}</p>
        </div>
      )}

      {/* Top bar — no background plate, sits over the video/dark canvas. */}
      <div className="relative z-10 flex items-center gap-3 px-[18px] pt-2.5 pb-1">
        <a
          href="/dashboard/owner"
          aria-label={copy.finish}
          className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-white/[0.14]"
        >
          <svg width="17" height="17" viewBox="0 0 16 16" fill="none" aria-hidden="true" className={dir === 'rtl' ? 'scale-x-[-1]' : ''}>
            <path d="M10 3.5L5.5 8L10 12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
        <h1 className="flex-1 truncate text-[16px] font-semibold">{copy.heading}</h1>
        {scanning && torchSupported ? (
          <button
            type="button"
            aria-pressed={torchOn}
            aria-label={copy.torch}
            onClick={toggleTorch}
            className={`flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full ${torchOn ? 'bg-white text-[#111]' : 'bg-white/[0.14] text-white'}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 2h8l-2 8h4l-10 12 2-9H7z" />
            </svg>
          </button>
        ) : (
          <span className="h-[38px] w-[38px] shrink-0" aria-hidden="true" />
        )}
      </div>

      {!result && scanning && (
        <>
          <div className="relative z-10 mx-auto mt-[9vh] h-[250px] w-[250px]">
            <div className="absolute top-0 left-0 h-[46px] w-[46px] rounded-tl-[16px] border-t-4 border-l-4 border-[#FF6B4A]" />
            <div className="absolute top-0 right-0 h-[46px] w-[46px] rounded-tr-[16px] border-t-4 border-r-4 border-[#FF6B4A]" />
            <div className="absolute bottom-0 left-0 h-[46px] w-[46px] rounded-bl-[16px] border-b-4 border-l-4 border-[#FF6B4A]" />
            <div className="absolute bottom-0 right-0 h-[46px] w-[46px] rounded-br-[16px] border-b-4 border-r-4 border-[#FF6B4A]" />
            <div
              className="motion-safe:animate-[scan-line-move_1.6s_ease-in-out_infinite_alternate] absolute top-1/2 right-[10px] left-[10px] h-[2px] rounded-full bg-[#FF6B4A] shadow-[0_0_14px_3px_rgba(255,107,74,0.75)]"
            />
          </div>
          <p className="relative z-10 mt-[22px] px-8 text-center text-[15px] font-medium text-white/90">{copy.aimHint}</p>
        </>
      )}

      {!result && !scanning && cameraSupported && (
        <div className="relative z-10 flex flex-col items-center gap-3 px-8 pt-[16vh]">
          <button
            type="button"
            onClick={() => {
              setCameraError('')
              setScanning(true)
            }}
            className="w-full max-w-xs rounded-2xl bg-[#FF6B4A] py-3 text-[15px] font-semibold text-white"
          >
            {copy.startScan}
          </button>
          {cameraError && <p className="text-center text-[12px] text-red-300">{copy.cameraStartFailed}</p>}
        </div>
      )}

      {/* Manual entry — pinned bottom sheet, always available regardless of
          camera state (unconditionally, same as before the redesign). */}
      {!result && (
        <div className="fixed inset-x-0 bottom-0 z-10 px-[18px] pb-[26px]">
          <form
            onSubmit={handleManualSubmit}
            className="rounded-[22px] border border-white/[0.12] bg-[rgba(28,28,28,0.82)] p-4 pt-4 backdrop-blur-[12px]"
          >
            <div className="mx-auto mb-3.5 h-1 w-[38px] rounded-full bg-white/[0.28]" />
            <div className="mb-3.5">
              <p className="text-[14px] font-semibold">{copy.manualHeading}</p>
              <p className="text-[12px] text-white/55">
                {cameraSupported === false ? copy.cameraUnsupported : copy.manualEntrySubtitle}
              </p>
            </div>
            <div className="flex gap-2.5">
              <input
                value={manualValue}
                onChange={(e) => setManualValue(e.target.value)}
                placeholder={copy.manualPlaceholder}
                disabled={checking}
                className="flex-1 rounded-[13px] border border-white/[0.14] bg-white/10 px-[14px] py-[13px] text-[13.5px] text-white placeholder:text-white/45 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={checking || !manualValue.trim()}
                className="shrink-0 rounded-[13px] bg-white px-[18px] py-[13px] text-[14px] font-semibold text-[#1a1a1a] disabled:opacity-50"
              >
                {checking ? copy.checking : copy.manualSubmit}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Result bottom sheet */}
      {result && (
        <div className="fixed inset-x-0 bottom-0 z-20 rounded-[28px_28px_0_0] bg-white px-[22px] pt-[26px] pb-[30px] text-[#1a1a1a] shadow-[0_16px_32px_-18px_rgba(0,0,0,0.5)]">
          <div
            className={`mx-auto mb-4 flex h-[60px] w-[60px] items-center justify-center rounded-full ${
              result.kind === 'success' ? 'bg-[#dcfce7]' : 'bg-[#fee2e2]'
            }`}
          >
            {result.kind === 'success' ? (
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            )}
          </div>

          <p
            className={`mb-1 text-center text-[13px] font-semibold tracking-[0.06em] ${
              result.kind === 'success' ? 'text-[#15803d]' : 'text-[#dc2626]'
            }`}
          >
            {result.kind === 'success' ? copy.redeemedLabel : errorCopyFor(result.message, copy)}
          </p>

          {result.kind === 'success' && (
            <>
              <p className="mb-[22px] text-center text-[23px] font-black leading-[1.25]">{result.title}</p>

              {(result.isNewCustomer !== null || result.redemptionsToday !== null) && (
                <div className="mb-5 overflow-hidden rounded-[16px] border border-[#ececec] bg-[#FBFCFD]">
                  {result.isNewCustomer !== null && (
                    <div className="flex items-center justify-between border-b border-[#f2f2f2] px-4 py-3 last:border-b-0">
                      <span className="text-[13px] text-[#8a8a8a]">{copy.customerLabel}</span>
                      <span className="text-[13.5px] font-semibold">
                        {result.isNewCustomer ? copy.newCustomerFirstVisit : copy.returningCustomer}
                      </span>
                    </div>
                  )}
                  {result.redemptionsToday !== null && (
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-[13px] text-[#8a8a8a]">{copy.redemptionsTodayLabel}</span>
                      <span className="text-[13.5px] font-semibold">{result.redemptionsToday}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {result.kind === 'error' && result.message === 'no active offer for this shop' ? (
            <a
              href="/dashboard/owner#campaign-manager"
              className="mb-2.5 flex items-center justify-center gap-2.5 rounded-2xl bg-[#FF6B4A] py-[17px] text-[16px] font-semibold text-white"
            >
              {DASHBOARD_COPY[locale].campaigns.createButton}
            </a>
          ) : (
            <button
              type="button"
              onClick={() => {
                reset()
                setScanning(true)
              }}
              className="mb-2.5 flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#FF6B4A] py-[17px] text-[16px] font-semibold text-white"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 8V5a1 1 0 0 1 1-1h3M20 8V5a1 1 0 0 0-1-1h-3M4 16v3a1 1 0 0 0 1 1h3M20 16v3a1 1 0 0 1-1 1h-3" />
                <rect x="9" y="9" width="6" height="6" rx="1" />
              </svg>
              {copy.scanAnother}
            </button>
          )}
          <a href="/dashboard/owner" className="block text-center text-[14.5px] font-medium text-[#8a8a8a]">
            {copy.finish}
          </a>
        </div>
      )}
    </div>
  )
}
