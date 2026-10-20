import { readFileSync } from 'node:fs'
import path from 'node:path'
import QRCode from 'qrcode'
import sharp from 'sharp'

// ── Shop QR with the Jeeran mark in the centre ───────────────────────────
// Used by the printable sheet (/api/qr/[id]/pdf) and the dashboard preview
// (/api/qr/[id]). Every shop gets the same centre: the white J-with-pin
// (public/design/jeeran-mark-white.svg) on a navy disc with a thin light
// ring, on a white rounded tile. The data is unchanged
// (`/scan/<business_id>`); only the error-correction level goes up to H,
// so the symbol gets denser.
//
// Scannability rules:
// - Modules stay pure black on white with a 4-module quiet zone; no
//   colours, gradients or rounded/dotted modules.
// - The centre block is CLEARED from the module grid (not overlaid), on
//   whole-module boundaries, and is at most 20% of the symbol width
//   (≤ 4% of its area). Level H recovers ~30% of codewords.

export const QR_QUIET_ZONE = 4
const MAX_TILE_FRACTION = 0.2

const NAVY = '#1E3A8A'
const RING = '#C9D6F4'
const MARK_FILE = path.join(process.cwd(), 'public', 'design', 'jeeran-mark-white.svg')

// Largest odd tile (in modules) within the size cap. QR symbols are always
// an odd number of modules wide, so an odd tile sits exactly centred.
export function centreTileModules(symbolModules: number): number {
  const t = Math.floor(symbolModules * MAX_TILE_FRACTION)
  return t % 2 === 1 ? t : t - 1
}

// Renders the QR as a PNG `targetPx` wide or slightly less (an integer
// number of pixels per module keeps every module edge crisp).
export async function renderJeeranQrPng(text: string, targetPx: number): Promise<Buffer> {
  const qr = QRCode.create(text, { errorCorrectionLevel: 'H' })
  const n = qr.modules.size
  const total = n + QR_QUIET_ZONE * 2
  const px = Math.max(1, Math.floor(targetPx / total))
  const side = total * px

  const tile = centreTileModules(n)
  const tileStart = (n - tile) / 2
  const inTile = (r: number, c: number) => r >= tileStart && r < tileStart + tile && c >= tileStart && c < tileStart + tile

  const raw = Buffer.alloc(side * side, 255)
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!qr.modules.get(r, c) || inTile(r, c)) continue
      const y0 = (r + QR_QUIET_ZONE) * px
      const x0 = (c + QR_QUIET_ZONE) * px
      for (let y = y0; y < y0 + px; y++) raw.fill(0, y * side + x0, y * side + x0 + px)
    }
  }

  // Tile (white, rounded, hairline edge) inset half a module inside the
  // cleared block; the disc sits a module inside the tile edge.
  const tileOrigin = (tileStart + QR_QUIET_ZONE) * px
  const tilePx = tile * px
  const inset = px / 2
  const r = (tilePx - 3 * px) / 2
  const ring = Math.max(1, px * 0.35)
  const tileSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${tilePx}" height="${tilePx}">
    <rect x="${inset}" y="${inset}" width="${tilePx - 2 * inset}" height="${tilePx - 2 * inset}" rx="${px * 1.25}" fill="#FFFFFF" stroke="#E2E2E2" stroke-width="${Math.max(1, px / 6)}"/>
    <circle cx="${tilePx / 2}" cy="${tilePx / 2}" r="${r - ring / 2}" fill="${NAVY}" stroke="${RING}" stroke-width="${ring}"/>
  </svg>`
  const markPx = Math.round(r * 1.1) // mark height ≈ 55% of the disc
  const mark = await sharp(readFileSync(MARK_FILE), { density: 600 })
    .resize(markPx, markPx, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()
  const markOrigin = tileOrigin + Math.round((tilePx - markPx) / 2)

  return sharp(raw, { raw: { width: side, height: side, channels: 1 } })
    .toColourspace('srgb')
    .composite([
      { input: Buffer.from(tileSvg), left: tileOrigin, top: tileOrigin },
      { input: mark, left: markOrigin, top: markOrigin },
    ])
    .png()
    .toBuffer()
}
