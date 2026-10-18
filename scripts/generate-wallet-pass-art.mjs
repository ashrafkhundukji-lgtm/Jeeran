// Renders the Google Wallet membership pass artwork (square logo + hero
// band) from SVG, so it can be tweaked and re-rendered instead of edited as
// pixels:
//   node scripts/generate-wallet-pass-art.mjs
//
// Writes the SVG sources to scripts/wallet-pass-art/ (open them in a browser
// to preview) and the PNGs Google actually fetches to public/.
//
// No system fonts: the wordmark is shaped with fontkit (Arabic joining
// included) from the fonts already shipped in public/fonts and emitted as
// <path> outlines, so the render is identical on any machine. The mark is
// the same path data as public/design/jeeran-mark-white.svg.
//
// Sizes follow Google's brand guidelines
// (https://developers.google.com/wallet/generic/resources/brand-guidelines):
//   - Logo: 1:1 PNG, min 660x660, full-bleed background, not pre-masked,
//     15% margin because Wallet masks it to a circle. Wallet takes a single
//     URL and scales to the device, so it gets one 2x (1320) render.
//   - Hero: 1032x812 PNG, ~20dp breathing room top and bottom, main content
//     away from the edges.
//
// The background is pass-brand.json's hexBackgroundColor, so the hero band
// and logo match the pass exactly. Google caches images by URL: after
// re-rendering, bump the ?v= in pass-brand.json's logoUrl/heroImageUrl.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import fontkit from '@pdf-lib/fontkit'
import sharp from 'sharp'

const root = new URL('../', import.meta.url)
const brand = JSON.parse(readFileSync(new URL('src/lib/wallet/pass-brand.json', root), 'utf8'))

const NAVY = brand.hexBackgroundColor
const WHITE = '#FFFFFF'
const CREAM = '#FFF8F1'
const CORAL_BRAND = '#FF6B4A' // the logo pin only (decorative, never text)
const NAVY_DEEP = '#12296B'

// Jeeran mark (public/design/jeeran-mark-white.svg), in its own coordinate
// space; MARK_BOX is that file's viewBox.
const MARK_BOX = { x: 75, y: 95, w: 215, h: 235 }
function mark(stroke, pinDot) {
  return `
    <path d="M 100 110 L 260 110" stroke="${stroke}" stroke-width="24" stroke-linecap="round" fill="none"/>
    <path d="M 230 110 C 230 110, 280 180, 230 250 C 180 320, 90 290, 90 220" fill="none" stroke="${stroke}" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M 230 110 L 230 180" stroke="${stroke}" stroke-width="24" stroke-linecap="round" fill="none"/>
    <g transform="translate(160, 205)">
      <path d="M 0 0 C -12 -12, -18 -24, -18 -36 C -18 -50, -8 -58, 0 -58 C 8 -58, 18 -50, 18 -36 C 18 -24, 12 -12, 0 0 Z" fill="${CORAL_BRAND}"/>
      <circle cx="0" cy="-36" r="6" fill="${pinDot}"/>
    </g>`
}

// Places the mark so its viewBox is `height` tall with its centre at (cx, cy).
function placedMark(cx, cy, height) {
  const s = height / MARK_BOX.h
  const x = cx - (MARK_BOX.w * s) / 2 - MARK_BOX.x * s
  const y = cy - height / 2 - MARK_BOX.y * s
  return `<g transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${s.toFixed(5)})">${mark(WHITE, NAVY_DEEP)}</g>`
}

// Shapes `text` with fontkit and returns it as one <path>, plus its ink box
// (in output pixels, relative to the baseline origin) for centring.
function textPath(fontFile, text, size, { letterSpacing = 0 } = {}) {
  const font = fontkit.create(readFileSync(new URL(`public/fonts/${fontFile}`, root)))
  const run = font.layout(text) // glyphs come back in visual (left-to-right) order
  const s = size / font.unitsPerEm
  let penX = 0
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  const parts = []
  run.glyphs.forEach((glyph, i) => {
    const pos = run.positions[i]
    const gx = penX + pos.xOffset * s
    const gy = -pos.yOffset * s
    const bbox = glyph.path.bbox
    if (Number.isFinite(bbox.minX)) {
      minX = Math.min(minX, gx + bbox.minX * s)
      maxX = Math.max(maxX, gx + bbox.maxX * s)
      minY = Math.min(minY, gy - bbox.maxY * s)
      maxY = Math.max(maxY, gy - bbox.minY * s)
    }
    // Font units are y-up; flip into SVG's y-down space.
    parts.push(`<path transform="translate(${gx.toFixed(2)} ${gy.toFixed(2)}) scale(${s.toFixed(5)} ${(-s).toFixed(5)})" d="${glyph.path.toSVG()}"/>`)
    penX += pos.xAdvance * s + letterSpacing
  })
  return { svg: parts.join(''), box: { minX, maxX, minY, maxY, w: maxX - minX, h: maxY - minY } }
}

// Draws a shaped text block with its ink box centred horizontally on cx and
// its ink top at `top`.
function placedText(t, cx, top, fill) {
  const x = cx - t.box.w / 2 - t.box.minX
  const y = top - t.box.minY
  return `<g transform="translate(${x.toFixed(2)} ${y.toFixed(2)})" fill="${fill}">${t.svg}</g>`
}

function logoSvg() {
  const S = 1320
  // Mark kept well inside the 15% margin so the circular mask never clips
  // the pin or the stroke ends.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  <rect width="${S}" height="${S}" fill="${NAVY}"/>
  ${placedMark(S / 2, S / 2, S * 0.52)}
</svg>
`
}

function heroSvg() {
  const W = 1032
  const H = 812
  const cx = W / 2

  const ar = textPath('ReadexPro-Bold.ttf', 'جيران', 150)
  const en = textPath('ReadexPro-Bold.ttf', 'Jeeran', 60, { letterSpacing: 4 })

  // Vertical stack, centred as one block: mark, Arabic wordmark, English.
  const markH = 210
  const gapMark = 44
  const gapText = 30
  const blockH = markH + gapMark + ar.box.h + gapText + en.box.h
  const top = (H - blockH) / 2

  const markCy = top + markH / 2
  const arTop = top + markH + gapMark
  const enTop = arTop + ar.box.h + gapText

  // Decorative white-alpha circles, as on the scan page header (ScanView) —
  // only at the corners, so a crop on any phone loses decoration, never
  // content.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${NAVY}"/>
  <circle cx="40" cy="40" r="230" fill="${WHITE}" fill-opacity="0.07"/>
  <circle cx="${W - 20}" cy="${H - 10}" r="210" fill="${WHITE}" fill-opacity="0.06"/>
  ${placedMark(cx, markCy, markH)}
  ${placedText(ar, cx, arTop, WHITE)}
  ${placedText(en, cx, enTop, CREAM)}
</svg>
`
}

async function render(name, svg, outPng) {
  const svgPath = new URL(`scripts/wallet-pass-art/${name}.svg`, root)
  writeFileSync(svgPath, svg)
  const info = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(fileURLToPath(new URL(outPng, root)))
  console.log(`${outPng}  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(1)} KB`)
}

mkdirSync(new URL('scripts/wallet-pass-art/', root), { recursive: true })
await render('logo', logoSvg(), 'public/wallet-pass-logo.png')
await render('hero', heroSvg(), 'public/wallet-pass-hero.png')
