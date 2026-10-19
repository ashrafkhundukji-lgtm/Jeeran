import QRCode from 'qrcode'
import sharp from 'sharp'

// ── Shop QR with a centre logo ───────────────────────────────────────────
// Used by the printable sheet (/api/qr/[id]/pdf) and the dashboard preview
// (/api/qr/[id]). The data is unchanged (`/scan/<business_id>`); only the
// error-correction level goes up to H, so the symbol gets denser.
//
// Scannability rules:
// - Modules stay pure black on white with a 4-module quiet zone; no
//   colours, gradients or rounded/dotted modules.
// - The centre block is CLEARED from the module grid (not overlaid), on
//   whole-module boundaries, and is at most 20% of the symbol width
//   (≤ 4% of its area). Level H recovers ~30% of codewords.
// - The logo is fitted (contain) inside a white rounded tile within that
//   block, with a module of padding; never stretched or cropped.

export const QR_QUIET_ZONE = 4
const MAX_TILE_FRACTION = 0.2

// Jeeran mark (public/design/jeeran-mark-navy.svg) — the fallback logo.
const JEERAN_MARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="75 95 215 235">
  <path d="M 100 110 L 260 110" stroke="#1E3A8A" stroke-width="24" stroke-linecap="round"/>
  <path d="M 230 110 C 230 110, 280 180, 230 250 C 180 320, 90 290, 90 220" fill="none" stroke="#1E3A8A" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M 230 110 L 230 180" stroke="#1E3A8A" stroke-width="24" stroke-linecap="round"/>
  <g transform="translate(160, 205)">
    <path d="M 0 0 C -12 -12, -18 -24, -18 -36 C -18 -50, -8 -58, 0 -58 C 8 -58, 18 -50, 18 -36 C 18 -24, 12 -12, 0 0 Z" fill="#FF6B4A"/>
    <circle cx="0" cy="-36" r="6" fill="#FFF8F1"/>
  </g>
</svg>`

// Fetches the shop's uploaded logo and checks it's a decodable image.
// Any failure (missing, timeout, not an image, huge) → null, so the caller
// falls back to the Jeeran mark and the sheet never breaks.
export async function fetchLogo(url: string | null | undefined): Promise<Buffer | null> {
  if (!url) return null
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return null
    const input = Buffer.from(await res.arrayBuffer())
    const meta = await sharp(input, { limitInputPixels: 40_000_000 }).metadata()
    if (!meta.width || !meta.height) return null
    return input
  } catch {
    return null
  }
}

// Largest odd tile (in modules) within the size cap. QR symbols are always
// an odd number of modules wide, so an odd tile sits exactly centred.
export function centreTileModules(symbolModules: number): number {
  const t = Math.floor(symbolModules * MAX_TILE_FRACTION)
  return t % 2 === 1 ? t : t - 1
}

// Renders the QR as a PNG `targetPx` wide or slightly less (an integer
// number of pixels per module keeps every module edge crisp).
export async function renderLogoQrPng(text: string, logo: Buffer | null, targetPx: number): Promise<Buffer> {
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
  // cleared block; the logo gets one more module of padding inside that.
  const tileOrigin = (tileStart + QR_QUIET_ZONE) * px
  const tilePx = tile * px
  const inset = px / 2
  const tileSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${tilePx}" height="${tilePx}">
    <rect x="${inset}" y="${inset}" width="${tilePx - 2 * inset}" height="${tilePx - 2 * inset}" rx="${px * 1.25}" fill="#FFFFFF" stroke="#E2E2E2" stroke-width="${Math.max(1, px / 6)}"/>
  </svg>`
  const logoPx = tilePx - 3 * px
  const logoImg = await fitLogo(logo, logoPx)

  return sharp(raw, { raw: { width: side, height: side, channels: 1 } })
    .toColourspace('srgb')
    .composite([
      { input: Buffer.from(tileSvg), left: tileOrigin, top: tileOrigin },
      { input: logoImg, left: tileOrigin + Math.round((tilePx - logoPx) / 2), top: tileOrigin + Math.round((tilePx - logoPx) / 2) },
    ])
    .png()
    .toBuffer()
}

// Logo fitted inside a `size` square (contain, centred), flattened onto
// white so transparent logos sit on the tile. Bad input → Jeeran mark.
async function fitLogo(logo: Buffer | null, size: number): Promise<Buffer> {
  const fit = (input: Buffer, density?: number) =>
    sharp(input, { limitInputPixels: 40_000_000, density })
      .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .flatten({ background: '#FFFFFF' })
      .png()
      .toBuffer()
  if (logo) {
    try {
      return await fit(logo)
    } catch {
      // fall through to the mark
    }
  }
  return fit(Buffer.from(JEERAN_MARK_SVG), 300)
}
