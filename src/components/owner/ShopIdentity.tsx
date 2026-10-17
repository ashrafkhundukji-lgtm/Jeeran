'use client'

import { useRef, useState } from 'react'
import { useLocale } from '@/lib/i18n/useLocale'
import { OWNER_UI_COPY, type OwnerUiCopy } from '@/lib/i18n/ownerUi'
import { CameraIcon, CheckIcon, ImageIcon, TrashIcon } from '@/components/customer/icons'
import OfferCard from '@/components/customer/OfferCard'
import { ShopAvatar } from '@/components/customer/primitives'
import { downscaleImage, ImageDecodeError } from './imageResize'
import { Card, ERROR_TEXT } from './ui'

type Kind = 'logo' | 'cover'
type Status = { state: 'idle' } | { state: 'uploading'; progress: number } | { state: 'done'; message: string } | { state: 'error'; message: string }

const MAX_BYTES = 2 * 1024 * 1024

// XHR rather than fetch so we get real upload progress on slow mobile data.
function upload(businessId: string, kind: Kind, file: File, onProgress: (p: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `/api/business/${businessId}/images`)
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total)
    xhr.onload = () => {
      let body: { url?: string; error?: string } = {}
      try {
        body = JSON.parse(xhr.responseText)
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300 && body.url) resolve(body.url)
      else reject(Object.assign(new Error(body.error ?? 'failed'), { status: xhr.status }))
    }
    xhr.onerror = () => reject(Object.assign(new Error('network'), { status: 0 }))
    const form = new FormData()
    form.append('kind', kind)
    form.append('file', file)
    xhr.send(form)
  })
}

function errorMessage(e: unknown, p: OwnerUiCopy['profile']): string {
  if (e instanceof ImageDecodeError) return p.wrongType
  const status = (e as { status?: number }).status
  if (status === 413) return p.tooBig
  if (status === 415 || status === 400) return p.wrongType
  if (status === 0) return p.network
  return p.generic
}

// "Shop identity" on the profile page: logo (square) + optional cover
// (16:9), each uploaded immediately (independent of the profile form's
// save bar), plus a small live preview of where they show up — the
// customer offer card and the QR sheet header.
export default function ShopIdentity({
  businessId,
  businessName,
  category,
  initialLogo,
  initialCover,
}: {
  businessId: string
  businessName: string
  category: string
  initialLogo: string | null
  initialCover: string | null
}) {
  const [locale] = useLocale()
  const copy = OWNER_UI_COPY[locale]
  const p = copy.profile
  const [urls, setUrls] = useState<Record<Kind, string | null>>({ logo: initialLogo, cover: initialCover })
  const [status, setStatus] = useState<Record<Kind, Status>>({ logo: { state: 'idle' }, cover: { state: 'idle' } })
  const inputs = { logo: useRef<HTMLInputElement>(null), cover: useRef<HTMLInputElement>(null) }

  const setKind = (kind: Kind, s: Status) => setStatus((prev) => ({ ...prev, [kind]: s }))

  async function handleFile(kind: Kind, file: File | undefined) {
    if (!file) return
    setKind(kind, { state: 'uploading', progress: 0 })
    try {
      // Downscale first so a phone photo fits the 2 MB server limit; the
      // server still crops/re-encodes to the final size.
      const resized = await downscaleImage(file, kind === 'logo' ? 1024 : 1600, 0)
      if (resized.size > MAX_BYTES) throw Object.assign(new Error('too_large'), { status: 413 })
      const url = await upload(businessId, kind, resized, (progress) => setKind(kind, { state: 'uploading', progress }))
      setUrls((prev) => ({ ...prev, [kind]: url }))
      setKind(kind, { state: 'done', message: p.uploaded })
    } catch (e) {
      setKind(kind, { state: 'error', message: errorMessage(e, p) })
    }
  }

  async function remove(kind: Kind) {
    setKind(kind, { state: 'uploading', progress: 1 })
    try {
      const res = await fetch(`/api/business/${businessId}/images?kind=${kind}`, { method: 'DELETE' })
      if (!res.ok) throw Object.assign(new Error('failed'), { status: res.status })
      setUrls((prev) => ({ ...prev, [kind]: null }))
      setKind(kind, { state: 'done', message: p.removed })
    } catch (e) {
      setKind(kind, { state: 'error', message: errorMessage(e instanceof TypeError ? Object.assign(e, { status: 0 }) : e, p) })
    }
  }

  // Called as a plain function (not <Slot>) so it never remounts mid-upload.
  function renderSlot(kind: Kind) {
    const url = urls[kind]
    const s = status[kind]
    const busy = s.state === 'uploading'
    return (
      <div>
        <div className="flex items-center gap-4">
          <div
            className={`relative shrink-0 overflow-hidden border border-brand-line bg-brand-tint ${
              kind === 'logo' ? 'h-20 w-20 rounded-full' : 'aspect-[16/9] w-32 rounded-2xl'
            }`}
          >
            {url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-brand-navy">
                <ImageIcon size={26} />
              </span>
            )}
            {busy && (
              <span className="absolute inset-0 flex items-center justify-center bg-white/80">
                <span aria-hidden="true" className="h-6 w-6 animate-spin rounded-full border-2 border-brand-tint-2 border-t-brand-navy motion-reduce:animate-none" />
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold">{kind === 'logo' ? p.logo : p.cover}</p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => inputs[kind].current?.click()}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border-[1.5px] border-brand-tint-2 bg-white px-3 text-sm font-semibold text-brand-navy disabled:opacity-50"
              >
                <CameraIcon size={17} />
                {url ? p.replace : p.upload}
              </button>
              {url && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => remove(kind)}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-brand-coral disabled:opacity-50"
                >
                  <TrashIcon size={17} />
                  {p.remove}
                </button>
              )}
            </div>
          </div>
        </div>
        <input
          ref={inputs[kind]}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            handleFile(kind, e.target.files?.[0])
            e.target.value = ''
          }}
        />
        <p className="mt-2 text-[13px] leading-relaxed text-brand-muted">{kind === 'logo' ? p.logoHelp : p.coverHelp}</p>
        <div aria-live="polite">
          {s.state === 'uploading' && s.progress < 1 && (
            <div className="mt-2">
              <div className="h-1.5 overflow-hidden rounded-full bg-brand-tint">
                <div className="h-full rounded-full bg-brand-navy transition-[width]" style={{ width: `${Math.round(s.progress * 100)}%` }} />
              </div>
              <p className="mt-1 text-[13px] text-brand-muted">
                {p.uploading} <bdi dir="ltr">{Math.round(s.progress * 100)}%</bdi>
              </p>
            </div>
          )}
          {s.state === 'done' && (
            <p className="mt-2 flex items-center gap-1 text-[13px] font-semibold text-brand-navy">
              <CheckIcon size={16} strokeWidth={2.6} />
              {s.message}
            </p>
          )}
          {s.state === 'error' && (
            <p role="alert" className={ERROR_TEXT}>
              {s.message}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <section id="identity" className="scroll-mt-20">
      <h2 className="mb-2.5 font-display text-[17px] font-semibold">{p.identityHeading}</h2>
      <Card className="flex flex-col gap-5 p-4">
        {renderSlot('logo')}
        <div className="h-px bg-brand-line" />
        {renderSlot('cover')}
        <div className="h-px bg-brand-line" />
        <div>
          <p className="mb-2 text-sm font-semibold">{p.previewHeading}</p>
          <p className="mb-1.5 text-[13px] text-brand-muted">{p.previewCard}</p>
          <div inert className="pointer-events-none select-none">
            <OfferCard
              variant="featured"
              locale={locale}
              offer={{
                id: 'preview',
                href: '#',
                title: copy.form.titleHint,
                businessName,
                businessLogoUrl: urls.logo,
                category,
                distanceKm: null,
                imageUrl: urls.cover,
                endDate: null,
              }}
            />
          </div>
          <p className="mt-4 mb-1.5 text-[13px] text-brand-muted">{p.previewSheet}</p>
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-brand-line bg-brand-cream px-4 py-5 text-center">
            {urls.logo ? (
              <ShopAvatar name={businessName} logoUrl={urls.logo} size={56} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/design/jeeran-mark-navy.svg" alt="" width={40} height={40} className="h-10 w-10" />
            )}
            <p className="font-display text-[22px] leading-tight font-bold text-brand-navy-deep">
              <bdi dir="auto" className="line-clamp-2 break-words">
                {businessName}
              </bdi>
            </p>
          </div>
        </div>
      </Card>
    </section>
  )
}
