import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { PDFDocument, rgb, LineCapStyle, type PDFFont, type PDFPage, type RGB } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import sharp from 'sharp'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { fetchLogo, renderLogoQrPng } from '@/lib/qr/logoQr'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ── QR sheet (print) ─────────────────────────────────────────────────────
// A4 portrait by default; ?size=a5 gives the same layout scaled to A5 (e.g.
// a table tent) — the QR stays ≥ 6 cm either way. The QR still encodes
// exactly `${NEXT_PUBLIC_APP_URL}/scan/<business_id>` (unchanged), drawn
// pure black on white with a 4-module quiet zone, at error-correction level
// H with the shop logo (or Jeeran mark) in a cleared centre tile — see
// src/lib/qr/logoQr.ts.
//
// Text: the app's own faces, embedded — Readex Pro (shop name) and IBM
// Plex Sans Arabic (body). fontkit (via pdf-lib) does Arabic joining and
// mirrors RTL runs; pdf-lib has no bidi, so drawBidiLine() below splits a
// line into same-direction runs and lays them out in visual order — this
// is what makes Arabic-only, English-only and mixed names all render
// correctly. Readex Pro has no Urdu-only letters (ٹ ڈ ڑ ے …), so each run
// uses the first face that covers ALL of it (swapping faces mid-word would
// break Arabic joining): Readex → IBM Plex Sans Arabic (which covers
// Arabic, Urdu and Latin).

const FONT_DIR = path.join(process.cwd(), 'public', 'fonts')

const NAVY = hex('#1E3A8A')
const NAVY_DEEP = hex('#12296B')
const CORAL = hex('#CF3B19')
const CORAL_BRAND = hex('#FF6B4A') // the logo pin only (decorative, never text)
const CREAM = hex('#FFF8F1')
const LINE = hex('#EDE3D6')
const WHITE = rgb(1, 1, 1)

const PAGE_SIZES = {
  a4: [595.28, 841.89],
  a5: [419.53, 595.28],
} as const
const CM = 72 / 2.54

// Final bilingual explanation, kept to what the scan page actually does: it
// shows offers from OTHER shops (get_top_ads() excludes the host and has no
// distance filter, so no "nearby" claim there) and offers the free Jeeran
// Wallet card, whose offers ARE filtered by distance from the customer.
const EXPLAIN_AR = 'امسح الرمز لتشاهد عروضًا من محلات أخرى، واحفظ بطاقة جيران لتصلك العروض القريبة منك. مجانًا، بدون تطبيق.'
const EXPLAIN_EN = 'Scan to see offers from other shops, and save the Jeeran card to get offers near you. Free, no app needed.'

// Jeeran mark path data (public/design/jeeran-mark-navy.svg).
const MARK_TOP_BAR = 'M 100 110 L 260 110'
const MARK_CURVE = 'M 230 110 C 230 110, 280 180, 230 250 C 180 320, 90 290, 90 220'
const MARK_VERTICAL = 'M 230 110 L 230 180'
const MARK_PIN = 'M 160 205 C 148 193, 142 181, 142 169 C 142 155, 152 147, 160 147 C 168 147, 178 155, 178 169 C 178 181, 172 193, 160 205 Z'

function hex(h: string): RGB {
  const n = parseInt(h.slice(1), 16)
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255)
}

// ── Fonts with per-character fallback ──
interface Face {
  pdf: PDFFont
  has: (cp: number) => boolean
}
type FontkitFont = { hasGlyphForCodePoint(cp: number): boolean }

async function loadFace(doc: PDFDocument, file: string): Promise<Face> {
  const bytes = readFileSync(path.join(FONT_DIR, file))
  const fk = fontkit.create(bytes) as unknown as FontkitFont
  const pdf = await doc.embedFont(bytes, { subset: true })
  return { pdf, has: (cp) => fk.hasGlyphForCodePoint(cp) }
}

// ── Minimal bidi (enough for one-line shop names / captions) ──
const RTL_RE = /[֐-ࣿיִ-﷿ﹰ-﻿]/
const LTR_RE = /[A-Za-z0-9À-ɏ٠-٩۰-۹]/ // digits (incl. Arabic-Indic) read left-to-right

type Dir = 'rtl' | 'ltr'
const isNeutral = (ch: string) => !RTL_RE.test(ch) && !LTR_RE.test(ch)

function baseDir(text: string): Dir {
  for (const ch of text) {
    if (RTL_RE.test(ch)) return 'rtl'
    if (LTR_RE.test(ch)) return 'ltr'
  }
  return 'ltr'
}

// Splits into same-direction runs. Neutrals (spaces, punctuation) take the
// direction of their neighbours when both sides agree, otherwise the base
// direction. Returns runs in VISUAL (left-to-right drawing) order.
function bidiRuns(text: string, base: Dir): { text: string; dir: Dir }[] {
  const chars = Array.from(text)
  const strong: (Dir | null)[] = chars.map((c) => (RTL_RE.test(c) ? 'rtl' : LTR_RE.test(c) ? 'ltr' : null))
  const resolved: Dir[] = chars.map((_, i) => {
    if (strong[i]) return strong[i]!
    let before: Dir | null = null
    for (let j = i - 1; j >= 0 && !before; j--) before = strong[j]
    let after: Dir | null = null
    for (let j = i + 1; j < chars.length && !after; j++) after = strong[j]
    return before && before === after ? before : base
  })
  const runs: { text: string; dir: Dir }[] = []
  chars.forEach((c, i) => {
    const last = runs[runs.length - 1]
    if (last && last.dir === resolved[i]) last.text += c
    else runs.push({ text: c, dir: resolved[i] })
  })
  return base === 'rtl' ? runs.reverse() : runs
}

// Picks one face for the whole run when any face covers every character;
// only if none does, splits per character (last resort).
function faceRuns(text: string, faces: Face[]): { text: string; face: Face }[] {
  const cps = Array.from(text, (ch) => ch.codePointAt(0)!)
  const whole = faces.find((f) => cps.every((cp) => isNeutral(String.fromCodePoint(cp)) || f.has(cp)))
  if (whole) return [{ text, face: whole }]
  const out: { text: string; face: Face }[] = []
  for (const ch of text) {
    const cp = ch.codePointAt(0)!
    const face = isNeutral(ch) && out.length ? out[out.length - 1].face : (faces.find((f) => f.has(cp)) ?? faces[0])
    const last = out[out.length - 1]
    if (last && last.face === face) last.text += ch
    else out.push({ text: ch, face })
  }
  return out
}

function measure(text: string, faces: Face[], size: number): number {
  return faceRuns(text, faces).reduce((w, r) => w + r.face.pdf.widthOfTextAtSize(r.text, size), 0)
}

function drawBidiLine(page: PDFPage, text: string, faces: Face[], size: number, centerX: number, y: number, color: RGB, base = baseDir(text)) {
  const segments: { text: string; face: Face; width: number }[] = []
  for (const run of bidiRuns(text, base)) {
    const pieces = faceRuns(run.text, faces)
    // Font fallback inside an RTL run: pieces are logical order, so draw
    // them right-to-left as well.
    if (run.dir === 'rtl') pieces.reverse()
    for (const p of pieces) segments.push({ ...p, width: p.face.pdf.widthOfTextAtSize(p.text, size) })
  }
  const total = segments.reduce((w, s) => w + s.width, 0)
  let x = centerX - total / 2
  for (const s of segments) {
    page.drawText(s.text, { x, y, size, font: s.face.pdf, color })
    x += s.width
  }
}

// Greedy word wrap in logical order (width doesn't depend on visual order).
function wrap(text: string, faces: Face[], size: number, maxWidth: number): string[] {
  const words = text.trim().split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    const candidate = line ? `${line} ${w}` : w
    if (!line || measure(candidate, faces, size) <= maxWidth) line = candidate
    else {
      lines.push(line)
      line = w
    }
  }
  if (line) lines.push(line)
  // A single word wider than the line (long unbroken name): hard-split.
  return lines.flatMap((l) => {
    if (measure(l, faces, size) <= maxWidth) return [l]
    const parts: string[] = []
    let cur = ''
    for (const ch of Array.from(l)) {
      if (cur && measure(cur + ch, faces, size) > maxWidth) {
        parts.push(cur)
        cur = ch
      } else cur += ch
    }
    if (cur) parts.push(cur)
    return parts
  })
}

function ellipsize(text: string, faces: Face[], size: number, maxWidth: number): string {
  let t = text
  while (t.length > 1 && measure(`${t}…`, faces, size) > maxWidth) t = Array.from(t).slice(0, -1).join('').trimEnd()
  // Prefer cutting at a word boundary over mid-word when one is available.
  const space = t.lastIndexOf(' ')
  if (space > 0 && t.length < text.length && text[t.length] !== ' ') t = t.slice(0, space).trimEnd()
  return `${t}…`
}

// Fit the shop name: largest size (down to `min`) where it fits in ≤ 2
// lines; still too long at `min` → 2 lines with the second truncated.
function fitName(name: string, faces: Face[], maxWidth: number, max: number, min: number): { lines: string[]; size: number } {
  for (let size = max; size >= min; size -= 1) {
    const lines = wrap(name, faces, size, maxWidth)
    if (lines.length <= 2) return { lines, size }
  }
  const lines = wrap(name, faces, min, maxWidth)
  return { lines: [lines[0], ellipsize(lines.slice(1).join(' '), faces, min, maxWidth)], size: min }
}

async function logoPng(logo: Buffer | null): Promise<Buffer | null> {
  if (!logo) return null
  try {
    return await sharp(logo, { limitInputPixels: 40_000_000 })
      .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .flatten({ background: '#FFFFFF' })
      .png()
      .toBuffer()
  } catch {
    return null // a broken logo must never break the sheet — fall back to the Jeeran mark
  }
}

function drawMark(page: PDFPage, cx: number, cy: number, size: number) {
  // Mark viewBox is 75 95 215 235; scale so its height = size.
  const scale = size / 235
  const x = cx - (75 + 215 / 2) * scale
  const y = cy + (95 + 235 / 2) * scale
  // drawSvgPath scales the stroke width with the path, so this is in mark units.
  const stroke = { x, y, scale, borderColor: NAVY, borderWidth: 24, borderLineCap: LineCapStyle.Round }
  page.drawSvgPath(MARK_TOP_BAR, stroke)
  page.drawSvgPath(MARK_CURVE, stroke)
  page.drawSvgPath(MARK_VERTICAL, stroke)
  page.drawSvgPath(MARK_PIN, { x, y, scale, color: CORAL_BRAND })
  page.drawCircle({ x: x + 160 * scale, y: y - 169 * scale, size: 6 * scale, color: CREAM })
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ business_id: string }> }) {
  const { business_id } = await params
  const sizeKey = req.nextUrl.searchParams.get('size') === 'a5' ? 'a5' : 'a4'

  const { data: business } = await supabaseAdmin.from('businesses').select('id, name, logo_url').eq('id', business_id).maybeSingle()
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const scanUrl = `${appUrl}/scan/${business_id}`

  const [W, H] = PAGE_SIZES[sizeKey]
  const s = W / PAGE_SIZES.a4[0] // every measurement below is A4 points × s

  const doc = await PDFDocument.create()
  doc.registerFontkit(fontkit)
  doc.setTitle(`Jeeran QR — ${business.name}`)
  doc.setCreator('Jeeran')
  const page = doc.addPage([W, H])

  const plexSemi = await loadFace(doc, 'IBMPlexSansArabic-SemiBold.ttf')
  const display = [await loadFace(doc, 'ReadexPro-Bold.ttf'), plexSemi]
  const bodyBold = [plexSemi]
  const body = [await loadFace(doc, 'IBMPlexSansArabic-Regular.ttf')]

  const margin = 48 * s
  const contentW = W - margin * 2
  const cx = W / 2

  // ── Layout pass: header height depends on logo + how many name lines ──
  const logoSource = await fetchLogo(business.logo_url)
  const logo = await logoPng(logoSource)
  const name = fitName(business.name, display, contentW, 40 * s, 24 * s)
  const nameLead = name.size * 1.25
  const top = H - 54 * s
  const logoBox = logo ? 110 * s : 64 * s
  const nameTop = top - logoBox - 24 * s
  const bandBottom = nameTop - name.lines.length * nameLead - 30 * s

  // Cream header band + hairline frame — the only decoration (no grids or
  // dotted patterns; they muddy cheap prints).
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: WHITE })
  page.drawRectangle({ x: 0, y: bandBottom, width: W, height: H - bandBottom, color: CREAM })
  page.drawRectangle({ x: 18 * s, y: 18 * s, width: W - 36 * s, height: H - 36 * s, borderColor: LINE, borderWidth: 1.5 * s })

  // ── Header: shop logo (or the Jeeran mark) + shop name ──
  if (logo) {
    const img = await doc.embedPng(logo)
    const d = 104 * s
    page.drawRectangle({ x: cx - d / 2 - 3 * s, y: top - d - 3 * s, width: d + 6 * s, height: d + 6 * s, color: WHITE, borderColor: LINE, borderWidth: 1.5 * s })
    page.drawImage(img, { x: cx - d / 2, y: top - d, width: d, height: d })
  } else {
    drawMark(page, cx, top - logoBox / 2, logoBox)
  }
  let y = nameTop - name.size * 0.85
  for (const line of name.lines) {
    drawBidiLine(page, line, display, name.size, cx, y, NAVY_DEEP, baseDir(business.name))
    y -= nameLead
  }
  page.drawLine({ start: { x: cx - 28 * s, y: bandBottom + 16 * s }, end: { x: cx + 28 * s, y: bandBottom + 16 * s }, thickness: 4 * s, color: CORAL, lineCap: LineCapStyle.Round })

  // ── QR: pure black on white, 4-module quiet zone, 9 cm at A4 (≥ 6 cm at A5) ──
  const qrSide = Math.max(9 * CM * s, 6 * CM)
  const qrPng = await renderLogoQrPng(scanUrl, logoSource, 1200)
  const qrImg = await doc.embedPng(qrPng)
  const qrTop = bandBottom - 34 * s
  const qrX = cx - qrSide / 2
  const qrY = qrTop - qrSide
  page.drawRectangle({ x: qrX - 10 * s, y: qrY - 10 * s, width: qrSide + 20 * s, height: qrSide + 20 * s, color: WHITE, borderColor: NAVY, borderWidth: 2 * s })
  page.drawImage(qrImg, { x: qrX, y: qrY, width: qrSide, height: qrSide })

  // ── Bilingual explanation: Arabic first, then English ──
  y = qrY - 10 * s - 44 * s
  const arSize = 19 * s
  for (const line of wrap(EXPLAIN_AR, bodyBold, arSize, contentW - 20 * s)) {
    drawBidiLine(page, line, bodyBold, arSize, cx, y, NAVY_DEEP, 'rtl')
    y -= arSize * 1.6
  }
  y -= 6 * s
  const enSize = 15 * s
  for (const line of wrap(EXPLAIN_EN, body, enSize, contentW - 20 * s)) {
    drawBidiLine(page, line, body, enSize, cx, y, NAVY, 'ltr')
    y -= enSize * 1.5
  }

  // ── Footer: Jeeran, small ──
  const footY = 42 * s
  const footSize = 11 * s
  const brand = 'Jeeran · جيران'
  const brandW = measure(brand, bodyBold, footSize)
  const markSize = 16 * s
  const gap = 6 * s
  const totalW = markSize + gap + brandW
  drawMark(page, cx - totalW / 2 + markSize / 2, footY + footSize * 0.35, markSize)
  drawBidiLine(page, brand, bodyBold, footSize, cx - totalW / 2 + markSize + gap + brandW / 2, footY, NAVY, 'ltr')

  const pdfBytes = await doc.save()
  return new NextResponse(new Blob([Uint8Array.from(pdfBytes)]), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="jeeran-qr-${business_id}${sizeKey === 'a5' ? '-a5' : ''}.pdf"`,
      'Cache-Control': 'no-store',
    },
  })
}
