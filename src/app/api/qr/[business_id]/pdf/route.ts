import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import QRCode from 'qrcode'
import { PDFDocument, rgb, StandardFonts, LineCapStyle } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { ArabicShaper } from 'arabic-persian-reshaper'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Arabic, Arabic Supplement, Arabic Extended-A (covers Urdu-only letters
// like ٹ ڈ ڑ ں), and the Presentation Forms blocks.
const ARABIC_SCRIPT_RE = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/u

// pdf-lib has no text shaping engine (no glyph joining, no bidi reordering),
// so raw Arabic/Urdu text draws as disconnected isolated-form letters in the
// wrong visual order. ArabicShaper.convertArabic() handles both concerns
// itself — it reshapes into joined presentation-form glyphs *and* already
// returns them in left-to-right drawing order for exactly this kind of
// non-RTL-aware renderer, so no extra reversal is needed (confirmed by
// comparing rendered output against Chrome's native bidi-correct rendering
// — an added .reverse() here double-flips it back to backwards). Latin-only
// strings pass through untouched. Mixed script (Arabic name with embedded
// Latin/digits) isn't handled — the whole string is treated as one RTL run,
// which is a known simplification.
function shapeForPdf(text: string): string {
  if (!ARABIC_SCRIPT_RE.test(text)) return text
  return ArabicShaper.convertArabic(text)
}

// SVG path for a rounded rectangle, sized w x h with corner radius r,
// starting at local (0,0) top-left going clockwise — for use with
// drawSvgPath (which takes raw SVG path syntax directly).
function roundedRectPath(w: number, h: number, r: number): string {
  return `M ${r} 0 L ${w - r} 0 Q ${w} 0 ${w} ${r} L ${w} ${h - r} Q ${w} ${h} ${w - r} ${h} L ${r} ${h} Q 0 ${h} 0 ${h - r} L 0 ${r} Q 0 0 ${r} 0 Z`
}

// Icon mark path data, lifted directly from public/jeeran-logo.svg's
// <g id="logo-mark"> — drawSvgPath takes raw SVG path syntax, so these are
// the original `d` strings verbatim. The pin's nested translate(160,205)
// is baked into its coordinates since drawSvgPath has no nested transforms.
const ICON_TOP_BAR = 'M 100 110 L 260 110'
const ICON_CURVE = 'M 230 110 C 230 110, 280 180, 230 250 C 180 320, 90 290, 90 220'
const ICON_VERTICAL = 'M 230 110 L 230 180'
const ICON_PIN =
  'M 160 205 C 148 193, 142 181, 142 169 C 142 155, 152 147, 160 147 C 168 147, 178 155, 178 169 C 178 181, 172 193, 160 205 Z'

const NAVY = rgb(0x1e / 255, 0x3a / 255, 0x8a / 255)
const ORANGE = rgb(0xff / 255, 0x6b / 255, 0x4a / 255)
const GRID_LINE = rgb(0xe2 / 255, 0xe8 / 255, 0xf0 / 255)
const CARD_BG = rgb(0xfb / 255, 0xfc / 255, 0xfd / 255)
const INK = rgb(0.08, 0.09, 0.12)
const INK_SOFT = rgb(0.35, 0.35, 0.35)

// Static scatter of faint background pins + connections — same visual
// language as the site's animated map background, minus the animation
// (this is a print artifact).
const BG_PINS: [number, number][] = [
  [36, 56],
  [232, 44],
  [258, 300],
  [252, 384],
  [36, 396],
  [30, 210],
]
const BG_CONNECTIONS: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
  [5, 0],
]

export async function GET(req: NextRequest, { params }: { params: Promise<{ business_id: string }> }) {
  const { business_id } = await params

  const { data: business } = await supabaseAdmin
    .from('businesses')
    .select('id, name')
    .eq('id', business_id)
    .maybeSingle()
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const scanUrl = `${appUrl}/scan/${business_id}`
  const qrPngBuffer = await QRCode.toBuffer(scanUrl, { type: 'png', width: 600, margin: 1 })

  const pdfDoc = await PDFDocument.create()
  pdfDoc.registerFontkit(fontkit)

  const width = 288
  const height = 432
  const page = pdfDoc.addPage([width, height])

  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const arabicFontBytes = readFileSync(path.join(process.cwd(), 'public', 'fonts', 'Amiri-Regular.ttf'))
  // subset: true silently corrupts this font in a way that hangs Chrome's
  // PDF renderer (confirmed empirically) — full embed costs ~200KB but is
  // reliable, and this is a one-off manual download, not bandwidth-sensitive.
  const arabicFont = await pdfDoc.embedFont(arabicFontBytes, { subset: false })

  // ── Background: faint static map grid + pins, matching the site look ──
  page.drawRectangle({ x: 0, y: 0, width, height, color: CARD_BG })

  const gridStep = 24
  for (let gx = 0; gx <= width; gx += gridStep) {
    page.drawLine({
      start: { x: gx, y: 0 },
      end: { x: gx, y: height },
      thickness: 0.5,
      color: GRID_LINE,
      opacity: 0.5,
    })
  }
  for (let gy = 0; gy <= height; gy += gridStep) {
    page.drawLine({
      start: { x: 0, y: gy },
      end: { x: width, y: gy },
      thickness: 0.5,
      color: GRID_LINE,
      opacity: 0.5,
    })
  }

  for (const [a, b] of BG_CONNECTIONS) {
    const [x1, y1] = BG_PINS[a]
    const [x2, y2] = BG_PINS[b]
    page.drawLine({
      start: { x: x1, y: y1 },
      end: { x: x2, y: y2 },
      thickness: 1,
      color: NAVY,
      opacity: 0.06,
      dashArray: [4, 4],
    })
  }
  for (const [px, py] of BG_PINS) {
    page.drawCircle({ x: px, y: py, size: 3, color: ORANGE, opacity: 0.15 })
  }

  // ── Outer page frame: layered double line, print-card style ──
  const outerInset = 10
  page.drawRectangle({
    x: outerInset,
    y: outerInset,
    width: width - outerInset * 2,
    height: height - outerInset * 2,
    borderColor: NAVY,
    borderWidth: 1.2,
    borderOpacity: 0.35,
  })
  const innerInset = outerInset + 3.5
  page.drawRectangle({
    x: innerInset,
    y: innerInset,
    width: width - innerInset * 2,
    height: height - innerInset * 2,
    borderColor: NAVY,
    borderWidth: 0.5,
    borderOpacity: 0.18,
  })

  // ── Logo mark ──
  const iconScale = 0.32
  const iconCenterX = width / 2
  const iconCenterY = 363
  const iconX = iconCenterX - 180 * iconScale
  const iconY = iconCenterY + 180 * iconScale
  const iconRadius = 140 * iconScale

  page.drawCircle({
    x: iconCenterX,
    y: iconCenterY,
    size: iconRadius,
    borderColor: NAVY,
    borderWidth: 1,
    borderOpacity: 0.15,
    borderDashArray: [3, 3],
  })

  const strokeOpts = {
    x: iconX,
    y: iconY,
    scale: iconScale,
    borderColor: NAVY,
    borderWidth: 24 * iconScale,
    borderLineCap: LineCapStyle.Round,
  }
  page.drawSvgPath(ICON_TOP_BAR, strokeOpts)
  page.drawSvgPath(ICON_CURVE, strokeOpts)
  page.drawSvgPath(ICON_VERTICAL, strokeOpts)
  page.drawSvgPath(ICON_PIN, { x: iconX, y: iconY, scale: iconScale, color: ORANGE })

  page.drawCircle({
    x: iconX + 160 * iconScale,
    y: iconY - 169 * iconScale,
    size: 6 * iconScale,
    color: rgb(1, 1, 1),
  })

  // ── Wordmark ──
  const jeeranSize = 20
  const jeeranWidth = boldFont.widthOfTextAtSize('Jeeran', jeeranSize)
  page.drawText('Jeeran', {
    x: (width - jeeranWidth) / 2,
    y: 298,
    size: jeeranSize,
    font: boldFont,
    color: NAVY,
  })

  const arabicWord = shapeForPdf('جيران')
  const arabicSize = 15
  const arabicWidth = arabicFont.widthOfTextAtSize(arabicWord, arabicSize)
  page.drawText(arabicWord, {
    x: (width - arabicWidth) / 2,
    y: 278,
    size: arabicSize,
    font: arabicFont,
    color: ORANGE,
  })

  // ── Divider ──
  page.drawLine({
    start: { x: 64, y: 266 },
    end: { x: width - 64, y: 266 },
    thickness: 0.75,
    color: NAVY,
    opacity: 0.15,
  })

  // ── Shop name ──
  const shopNameRaw = business.name
  const shopNameShaped = shapeForPdf(shopNameRaw)
  const nameFont = ARABIC_SCRIPT_RE.test(shopNameRaw) ? arabicFont : boldFont
  const maxNameWidth = width - 56
  let nameSize = 17
  let nameWidth = nameFont.widthOfTextAtSize(shopNameShaped, nameSize)
  while (nameWidth > maxNameWidth && nameSize > 9) {
    nameSize -= 1
    nameWidth = nameFont.widthOfTextAtSize(shopNameShaped, nameSize)
  }
  page.drawText(shopNameShaped, {
    x: (width - nameWidth) / 2,
    y: 248,
    size: nameSize,
    font: nameFont,
    color: INK,
  })

  // ── QR code, framed ──
  const qrImage = await pdfDoc.embedPng(qrPngBuffer)
  const qrSize = 170
  const qrY = 50
  const qrX = (width - qrSize) / 2
  const qrPadding = 12
  const qrCornerRadius = 14

  page.drawSvgPath(roundedRectPath(qrSize + qrPadding * 2, qrSize + qrPadding * 2, qrCornerRadius), {
    x: qrX - qrPadding,
    y: qrY + qrSize + qrPadding,
    color: rgb(1, 1, 1),
    borderColor: NAVY,
    borderWidth: 1,
    borderOpacity: 0.3,
  })

  page.drawImage(qrImage, {
    x: qrX,
    y: qrY,
    width: qrSize,
    height: qrSize,
  })

  // ── Caption ──
  const caption = "Scan for today's neighborhood offers"
  const captionWidth = regularFont.widthOfTextAtSize(caption, 9)
  page.drawText(caption, {
    x: (width - captionWidth) / 2,
    y: 22,
    size: 9,
    font: regularFont,
    color: INK_SOFT,
  })

  const pdfBytes = await pdfDoc.save()

  return new NextResponse(new Blob([Uint8Array.from(pdfBytes)]), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="jeeran-qr-${business_id}.pdf"`,
    },
  })
}
