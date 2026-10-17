'use client'

import { useEffect, useId, useRef, useState } from 'react'
import jsQR from 'jsqr'
import OwnerShell, { OwnerTopBar } from '@/components/owner/OwnerShell'
import { useClientValue } from '@/components/owner/useClientValue'
import { BTN_CORAL, BTN_PRIMARY, Card, INPUT, SectionHeading } from '@/components/owner/ui'
import { PRESS } from '@/components/customer/primitives'
import {
  AlertIcon,
  CameraIcon,
  CheckIcon,
  ClockIcon,
  FlashIcon,
  KeyboardIcon,
  RefreshIcon,
  ScanIcon,
  WifiOffIcon,
  XCircleIcon,
} from '@/components/customer/icons'
import { useLocale } from '@/lib/i18n/useLocale'
import type { Locale } from '@/lib/i18n/locale'
import { DASHBOARD_COPY } from '@/lib/i18n/dashboard'
import { INTL_LOCALE, OWNER_UI_COPY, fill, type OwnerUiCopy } from '@/lib/i18n/ownerUi'

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

export interface RecentRedemption {
  id: string
  title: string
  at: string
}

type Outcome = 'success' | 'already' | 'pass' | 'invalid' | 'noOffer' | 'frozen' | 'network' | 'generic'

type RedeemResult =
  | {
      kind: 'success'
      title: string
      // Best-effort context from /api/redeem — null when the count query
      // itself failed server-side, in which case that line is omitted.
      isNewCustomer: boolean | null
      redemptionsToday: number | null
    }
  | { kind: Exclude<Outcome, 'success'>; raw: string }

type CameraState = 'idle' | 'starting' | 'scanning' | 'denied' | 'failed' | 'unsupported'

// /api/redeem's own error strings → result states. The route itself is
// unchanged; note there is no separate "wrong shop" or "expired offer"
// response — a valid member card always redeems against the scanning shop's
// own active offer, and a removed pass is the closest thing to "expired".
function outcomeFor(rawError: string): Exclude<Outcome, 'success' | 'network'> {
  switch (rawError) {
    case 'already redeemed by this customer':
      return 'already'
    case 'pass no longer active':
      return 'pass'
    case 'invalid or tampered barcode':
    case 'barcodeValue is required':
      return 'invalid'
    case 'no active offer for this shop':
      return 'noOffer'
    case 'This account is frozen':
      return 'frozen'
    default:
      return 'generic'
  }
}

function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    // Not supported (iOS) — silent.
  }
}

export default function RedeemScanner({ recent: initialRecent }: { recent: RecentRedemption[] }) {
  const [locale] = useLocale()
  const copy = OWNER_UI_COPY[locale]
  const r = copy.redeem
  const ids = useId()

  const [camera, setCamera] = useState<CameraState>('idle')
  const [checking, setChecking] = useState(false)
  const [manualValue, setManualValue] = useState('')
  const [result, setResult] = useState<RedeemResult | null>(null)
  const [torchSupported, setTorchSupported] = useState(false)
  const [torchOn, setTorchOn] = useState(false)
  const [recent, setRecent] = useState(initialRecent)
  const [lastCode, setLastCode] = useState('')

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null) // off-screen — only used to grab frames for the jsQR fallback path, never rendered
  const trackRef = useRef<MediaStreamTrack | null>(null) // the active camera track, kept only for the torch toggle below

  const scanning = camera === 'starting' || camera === 'scanning'

  // Feature check + auto-start when the camera permission is already
  // granted (a cashier reopening the page shouldn't need an extra tap);
  // otherwise wait for the explicit button so the permission prompt only
  // ever appears in response to a tap.
  const cameraApi = useClientValue(() => Boolean(navigator.mediaDevices?.getUserMedia), true)
  const cameraState: CameraState = cameraApi ? camera : 'unsupported'

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) return
    navigator.permissions
      ?.query({ name: 'camera' as PermissionName })
      .then((s) => {
        if (s.state === 'granted') setCamera('starting')
        else if (s.state === 'denied') setCamera('denied')
      })
      .catch(() => {})
  }, [])

  // Camera scan loop — only runs while scanning, torn down on every stop
  // (including an in-flight redeem check or unmount) so the camera stream
  // and detection loop never outlive the page. Decode logic unchanged from
  // the previous version.
  useEffect(() => {
    if (!scanning) return

    let stream: MediaStream | null = null
    let rafId = 0
    let stopped = false

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        if (stopped) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        const video = videoRef.current
        if (!video) return
        video.srcObject = stream
        await video.play()
        setCamera('scanning')

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
      } catch (e) {
        const name = (e as DOMException)?.name
        setCamera(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'failed')
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
      // `advanced`/`torch` aren't in TS's MediaTrackConstraintSet — a real
      // but non-standardized capability some Android Chrome builds expose.
      await track.applyConstraints({ advanced: [{ torch: !torchOn } as MediaTrackConstraintSet & TorchCapabilities] })
      setTorchOn((v) => !v)
    } catch {
      // Some browsers report the capability but reject the constraint.
    }
  }

  async function handleDecoded(barcodeValue: string) {
    setCamera('idle')
    setChecking(true)
    setResult(null)
    setLastCode(barcodeValue)

    try {
      const res = await fetch('/api/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcodeValue }),
      })
      const body = await res.json().catch(() => ({}))

      if (res.ok && body.ok) {
        const title = body.offer?.title ?? ''
        vibrate(200)
        setResult({
          kind: 'success',
          title,
          isNewCustomer: typeof body.isNewCustomer === 'boolean' ? body.isNewCustomer : null,
          redemptionsToday: typeof body.redemptionsToday === 'number' ? body.redemptionsToday : null,
        })
        setRecent((prev) => [{ id: `local-${Date.now()}`, title, at: new Date().toISOString() }, ...prev].slice(0, 8))
      } else {
        vibrate([80, 60, 80])
        setResult({ kind: outcomeFor(body.error ?? ''), raw: body.error ?? '' })
      }
    } catch {
      setResult({ kind: 'network', raw: '' })
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

  function scanNext() {
    setResult(null)
    setManualValue('')
    if (cameraState !== 'unsupported' && cameraState !== 'denied') setCamera('starting')
  }

  return (
    <OwnerShell
      tab="redeem"
      header={
        <OwnerTopBar
          variant="subpage"
          title={DASHBOARD_COPY[locale].redeem.heading}
          backHref="/dashboard/owner"
          backLabel={DASHBOARD_COPY[locale].common.back}
          trailing={
            scanning && torchSupported ? (
              <button
                type="button"
                aria-pressed={torchOn}
                aria-label={torchOn ? r.torchOff : r.torchOn}
                onClick={toggleTorch}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${torchOn ? 'bg-brand-navy text-white' : 'bg-white text-brand-navy'} ${PRESS}`}
              >
                <FlashIcon size={20} />
              </button>
            ) : undefined
          }
        />
      }
    >
      <div className="flex flex-col gap-5">
        {/* Camera viewport */}
        <section aria-label={r.aim}>
          <div className="relative aspect-square w-full overflow-hidden rounded-[24px] bg-brand-navy-deep text-white">
            {scanning && (
              <>
                <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" playsInline muted />
                <canvas ref={canvasRef} className="hidden" />
              </>
            )}

            {/* Framing guide — always drawn so the area never reads as a void */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-[14%]">
              {[
                'top-0 start-0 border-t-[5px] border-s-[5px] rounded-ss-[18px]',
                'top-0 end-0 border-t-[5px] border-e-[5px] rounded-se-[18px]',
                'bottom-0 start-0 border-b-[5px] border-s-[5px] rounded-es-[18px]',
                'bottom-0 end-0 border-b-[5px] border-e-[5px] rounded-ee-[18px]',
              ].map((c) => (
                <span key={c} className={`absolute h-12 w-12 ${scanning ? 'border-brand-coral-brand' : 'border-white/35'} ${c}`} />
              ))}
              {cameraState === 'scanning' && (
                <span className="absolute inset-x-3 top-1/2 h-[3px] rounded-full bg-brand-coral-brand shadow-[0_0_14px_3px_rgba(255,107,74,0.7)] motion-safe:animate-[scan-line-move_1.6s_ease-in-out_infinite_alternate]" />
              )}
            </div>

            {cameraState === 'scanning' && (
              <p className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-brand-navy-deep/90 to-transparent px-6 pt-10 pb-4 text-center text-[15px] font-semibold">
                {r.aim}
              </p>
            )}

            {cameraState === 'starting' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span aria-hidden="true" className="h-10 w-10 animate-spin rounded-full border-[3px] border-white/25 border-t-white motion-reduce:animate-none" />
              </div>
            )}

            {(cameraState === 'idle' || cameraState === 'failed') && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center">
                <ScanIcon size={44} className="text-white/80" />
                <p className="text-[15px] leading-relaxed text-white/85">{cameraState === 'failed' ? DASHBOARD_COPY[locale].redeem.cameraStartFailed : r.aim}</p>
                <button type="button" onClick={() => setCamera('starting')} className={`${BTN_CORAL} min-w-[200px]`}>
                  <CameraIcon size={20} />
                  {r.startCamera}
                </button>
              </div>
            )}

            {cameraState === 'denied' && (
              <div role="alert" className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white px-6 text-center text-brand-navy-deep">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-coral-tint text-brand-coral">
                  <CameraIcon size={28} />
                </span>
                <p className="font-display text-[17px] font-semibold">{r.deniedTitle}</p>
                <p className="text-sm leading-relaxed text-brand-muted">{r.deniedBody}</p>
                <button type="button" onClick={() => setCamera('starting')} className={`${BTN_PRIMARY} mt-1`}>
                  <RefreshIcon size={18} />
                  {copy.common.retry}
                </button>
              </div>
            )}

            {cameraState === 'unsupported' && (
              <div role="status" className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white px-6 text-center text-brand-navy-deep">
                <KeyboardIcon size={36} className="text-brand-navy" />
                <p className="text-[15px] leading-relaxed font-semibold">{r.unsupportedTitle}</p>
              </div>
            )}

            {checking && (
              <div role="status" className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-brand-navy-deep/80">
                <span aria-hidden="true" className="h-10 w-10 animate-spin rounded-full border-[3px] border-white/25 border-t-white motion-reduce:animate-none" />
                <p className="text-[15px] font-semibold">{r.checking}</p>
              </div>
            )}
          </div>
        </section>

        {/* Manual entry — always available */}
        <Card className="p-4">
          <form onSubmit={handleManualSubmit}>
            <label htmlFor={`${ids}-code`} className="flex items-center gap-2 font-display text-[16px] font-semibold">
              <KeyboardIcon size={20} className="text-brand-navy" />
              {r.manualHeading}
            </label>
            <p className="mt-1 mb-3 text-sm text-brand-muted">{r.manualBody}</p>
            <div className="flex gap-2.5">
              {/* The member code is "<uuid>.<hmac>" — letters, digits, '-' and
                  '.' — so a numeric keypad would make it impossible to type;
                  plain text, no autocorrect/capitalisation. */}
              <input
                id={`${ids}-code`}
                value={manualValue}
                onChange={(e) => setManualValue(e.target.value)}
                placeholder={r.manualPlaceholder}
                disabled={checking}
                dir="ltr"
                inputMode="text"
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="go"
                className={`${INPUT} min-w-0 flex-1 text-[15px] [&:not(:placeholder-shown)]:font-mono`}
              />
              <button type="submit" disabled={checking || !manualValue.trim()} className={`${BTN_PRIMARY} shrink-0`}>
                {checking ? r.checking : r.submit}
              </button>
            </div>
          </form>
        </Card>

        {/* Recent redemptions */}
        <section>
          <SectionHeading>{r.recentHeading}</SectionHeading>
          {recent.length === 0 ? (
            <Card className="flex items-center gap-3 p-4 text-sm text-brand-muted">
              <ClockIcon size={20} className="shrink-0" />
              {r.recentEmpty}
            </Card>
          ) : (
            <Card>
              <ul>
                {recent.map((row) => (
                  <li key={row.id} className="flex min-h-14 items-center gap-3 border-b border-brand-line px-4 py-2.5 last:border-b-0">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-tint text-brand-navy">
                      <CheckIcon size={18} strokeWidth={2.6} />
                    </span>
                    <span className="min-w-0 flex-1 text-[15px] font-semibold">
                      <bdi dir="auto" className="line-clamp-1 break-all">
                        {row.title}
                      </bdi>
                    </span>
                    <span className="shrink-0 text-[13px] text-brand-muted">{relativeTime(row.at, locale)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </section>
      </div>

      {result && <ResultScreen result={result} copy={copy} locale={locale} onNext={scanNext} onRetry={() => handleDecoded(lastCode)} />}
    </OwnerShell>
  )
}

function relativeTime(iso: string, locale: Locale): string {
  const diffMin = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  const rtf = new Intl.RelativeTimeFormat(INTL_LOCALE[locale], { numeric: 'auto', style: 'short' })
  if (diffMin < 60) return rtf.format(-Math.max(diffMin, 0), 'minute')
  if (diffMin < 24 * 60) return rtf.format(-Math.round(diffMin / 60), 'hour')
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], { day: 'numeric', month: 'short' }).format(new Date(iso))
}

// Full-screen result, readable at arm's length: success = navy with a big
// white check; every failure = coral with the reason in large type. Covers
// the tab bar; the primary action is always "scan next".
function ResultScreen({
  result,
  copy,
  locale,
  onNext,
  onRetry,
}: {
  result: RedeemResult
  copy: OwnerUiCopy
  locale: Locale
  onNext: () => void
  onRetry: () => void
}) {
  const r = copy.redeem
  const ok = result.kind === 'success'
  const failure: Record<Exclude<Outcome, 'success'>, { title: string; body?: string; Icon: typeof AlertIcon }> = {
    already: { title: r.alreadyTitle, body: r.alreadyBody, Icon: XCircleIcon },
    pass: { title: r.passTitle, body: r.passBody, Icon: ClockIcon },
    invalid: { title: r.invalidTitle, body: r.invalidBody, Icon: XCircleIcon },
    noOffer: { title: r.noOfferTitle, body: r.noOfferBody, Icon: AlertIcon },
    frozen: { title: r.frozenTitle, Icon: AlertIcon },
    network: { title: r.networkTitle, body: r.networkBody, Icon: WifiOffIcon },
    generic: { title: r.genericTitle, body: copy.common.errorBody, Icon: AlertIcon },
  }
  const info = result.kind === 'success' ? null : failure[result.kind]
  const Icon = info?.Icon ?? CheckIcon

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="redeem-result-title"
      className={`fixed inset-0 z-50 flex justify-center ${ok ? 'bg-brand-hero' : 'bg-brand-coral'} text-white`}
    >
      <div
        className="flex w-full max-w-[480px] flex-col px-6 pt-[max(48px,env(safe-area-inset-top))]"
        style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <span className="flex h-28 w-28 items-center justify-center rounded-full bg-white text-current">
            <Icon size={64} strokeWidth={ok ? 3 : 2.4} className={ok ? 'text-brand-navy' : 'text-brand-coral'} />
          </span>
          <h2 id="redeem-result-title" className="font-display text-[34px] leading-tight font-bold">
            {ok ? r.successTitle : info!.title}
          </h2>
          {result.kind === 'success' ? (
            <>
              <p className="font-display text-[24px] leading-snug font-semibold">
                <bdi dir="auto" className="break-words">
                  {result.title}
                </bdi>
              </p>
              <p className="text-[17px] text-white/90">{r.successBody}</p>
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                {result.isNewCustomer !== null && (
                  <span className="rounded-full bg-white/15 px-4 py-2 text-[15px] font-semibold">
                    {result.isNewCustomer ? r.newCustomer : r.returningCustomer}
                  </span>
                )}
                {result.redemptionsToday !== null && (
                  <span className="rounded-full bg-white/15 px-4 py-2 text-[15px] font-semibold">{fill(r.todayCount, { n: result.redemptionsToday })}</span>
                )}
              </div>
            </>
          ) : (
            info!.body && <p className="max-w-[340px] text-[17px] leading-relaxed text-white/95">{info!.body}</p>
          )}
        </div>

        <div className="flex flex-col gap-2.5">
          {result.kind === 'noOffer' ? (
            <a href="/dashboard/owner" className={`inline-flex min-h-14 items-center justify-center rounded-2xl bg-white text-[17px] font-bold text-brand-coral ${PRESS}`}>
              {r.activateOffer}
            </a>
          ) : result.kind === 'network' ? (
            <button type="button" onClick={onRetry} className={`inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-white text-[17px] font-bold text-brand-coral ${PRESS}`}>
              <RefreshIcon size={20} />
              {copy.common.retry}
            </button>
          ) : (
            <button
              type="button"
              autoFocus
              onClick={onNext}
              className={`inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-white text-[17px] font-bold ${ok ? 'text-brand-navy' : 'text-brand-coral'} ${PRESS}`}
            >
              <ScanIcon size={22} />
              {r.scanNext}
            </button>
          )}
          {(result.kind === 'noOffer' || result.kind === 'network') && (
            <button type="button" onClick={onNext} className="min-h-12 rounded-2xl text-[16px] font-semibold text-white">
              {r.scanNext}
            </button>
          )}
          <a href="/dashboard/owner" className="flex min-h-12 items-center justify-center text-[16px] font-semibold text-white/85">
            {DASHBOARD_COPY[locale].redeem.finish}
          </a>
        </div>
      </div>
    </div>
  )
}
