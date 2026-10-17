'use client'

import { useState } from 'react'
import { useLocale } from '@/lib/i18n/useLocale'
import { OWNER_UI_COPY, fill } from '@/lib/i18n/ownerUi'
import { DownloadIcon, ShareIcon } from '@/components/customer/icons'
import { BTN_PRIMARY, BTN_SECONDARY, Card } from './ui'

export const qrPrintedKey = (businessId: string) => `jeeran:qr-printed:${businessId}`

// QR sheet block on the owner home: preview + Download + Share. Share sends
// the actual PDF file through the Web Share API (so an owner can hand it to
// a print shop on WhatsApp); where file sharing isn't supported it falls
// back to a plain download. The PDF itself is /api/qr/[id]/pdf (A4).
export default function QrSheetCard({
  businessId,
  businessName,
  onPrinted,
}: {
  businessId: string
  businessName: string
  onPrinted: () => void
}) {
  const [locale] = useLocale()
  const copy = OWNER_UI_COPY[locale].qr
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const pdfUrl = `/api/qr/${businessId}/pdf`
  const fileName = 'jeeran-qr.pdf'

  function markPrinted() {
    onPrinted()
  }

  function download(blob?: Blob) {
    const a = document.createElement('a')
    const objectUrl = blob ? URL.createObjectURL(blob) : null
    a.href = objectUrl ?? pdfUrl
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    a.remove()
    if (objectUrl) setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000)
  }

  async function share() {
    setError('')
    setBusy(true)
    try {
      const res = await fetch(pdfUrl)
      if (!res.ok) throw new Error(String(res.status))
      const blob = await res.blob()
      const file = new File([blob], fileName, { type: 'application/pdf' })
      const data = { files: [file], title: fileName, text: fill(copy.shareText, { name: businessName }) }
      if (navigator.canShare?.(data)) {
        try {
          await navigator.share(data)
          markPrinted()
        } catch (e) {
          // AbortError = the owner closed the share sheet; not an error.
          if ((e as DOMException)?.name !== 'AbortError') download(blob)
        }
      } else {
        download(blob)
        markPrinted()
      }
    } catch {
      setError(copy.failed)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="scroll-mt-20 p-4">
      <div id="qr-sheet" className="flex items-start gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/qr/${businessId}`}
          alt=""
          width={88}
          height={88}
          className="h-[88px] w-[88px] shrink-0 rounded-xl border border-brand-line bg-white p-1"
        />
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-[17px] font-semibold">{copy.heading}</h2>
          <p className="mt-1 text-sm leading-relaxed text-brand-muted">{copy.body}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <a href={pdfUrl} download={fileName} onClick={markPrinted} className={`${BTN_PRIMARY} !px-3 whitespace-nowrap`}>
          <DownloadIcon size={19} />
          {copy.download}
        </a>
        <button type="button" onClick={share} disabled={busy} className={`${BTN_SECONDARY} !px-3 whitespace-nowrap`}>
          <ShareIcon size={19} />
          {busy ? copy.preparing : copy.share}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-[13px] font-medium text-brand-coral">
          {error}
        </p>
      )}
    </Card>
  )
}
