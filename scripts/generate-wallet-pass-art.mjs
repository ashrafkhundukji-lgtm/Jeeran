// Renders the Google Wallet membership pass artwork so it can be tweaked and
// re-rendered instead of edited as pixels:
//   node scripts/generate-wallet-pass-art.mjs
//
//   - Logo: drawn from SVG (source written to scripts/wallet-pass-art/
//     logo.svg — open it in a browser to preview). The mark is the same path
//     data as public/design/jeeran-mark-white.svg.
//   - Hero: the approved street photo, scripts/wallet-pass-art/hero-source.jpg
//     (kept exactly as delivered), cropped to size with a light navy
//     gradient — no text or logo is drawn on it. Google's guidelines say not
//     to embed text in the hero ("This content won't be localized").
//
// Sizes follow Google's brand guidelines
// (https://developers.google.com/wallet/generic/resources/brand-guidelines):
//   - Logo: 1:1 PNG, min 660x660, full-bleed background, not pre-masked,
//     15% margin because Wallet masks it to a circle. Wallet takes a single
//     URL and scales to the device, so it gets one 2x (1320) render.
//   - Hero: 1032x812, main content away from the left/right edges (narrow
//     phones crop them).
//
// Google caches images by URL, and passes already on phones keep whatever
// URL they were given: when an image changes, write it to a NEW filename
// and point pass-brand.json at it — never overwrite a published file.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = new URL('../', import.meta.url)
const brand = JSON.parse(readFileSync(new URL('src/lib/wallet/pass-brand.json', root), 'utf8'))
const out = (path) => fileURLToPath(new URL(path, root))

const NAVY = brand.hexBackgroundColor
const WHITE = '#FFFFFF'
const CORAL_BRAND = '#FF6B4A' // the logo pin only (decorative, never text)
const NAVY_DEEP = '#12296B'

const HERO_W = 1032
const HERO_H = 812
const HERO_MAX_KB = 400

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

async function renderLogo() {
  const svg = logoSvg()
  writeFileSync(new URL('scripts/wallet-pass-art/logo.svg', root), svg)
  const info = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(out('public/wallet-pass-logo.png'))
  console.log(`public/wallet-pass-logo.png  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(1)} KB`)
}

// Light navy wash so the photo sits in the pass's colour: faint at the top
// (the sky stays warm), stronger at the bottom where the hero meets the
// navy pass body. Set both to 0 for the untinted photo.
const HERO_TINT_TOP = 0.08
const HERO_TINT_BOTTOM = 0.42

function heroTintSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${HERO_W}" height="${HERO_H}">
  <defs><linearGradient id="t" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${NAVY}" stop-opacity="${HERO_TINT_TOP}"/>
    <stop offset="1" stop-color="${NAVY}" stop-opacity="${HERO_TINT_BOTTOM}"/>
  </linearGradient></defs>
  <rect width="${HERO_W}" height="${HERO_H}" fill="url(#t)"/>
</svg>`
}

// The source is the photo exactly as delivered (1408x768); it's centre-
// cropped to the hero's 1032:812 shape and scaled to fit. The street's
// vanishing point and both central palms sit in the middle, which is also
// what survives a narrow phone's side crop.
async function renderHero() {
  const source = out('scripts/wallet-pass-art/hero-source.jpg')
  const target = 'public/wallet-pass-hero-v2.jpg'
  const info = await sharp(source)
    .resize(HERO_W, HERO_H, { fit: 'cover', position: 'centre' })
    .composite([{ input: Buffer.from(heroTintSvg()) }])
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(out(target))
  const kb = info.size / 1024
  console.log(`${target}  ${info.width}x${info.height}  ${kb.toFixed(1)} KB`)
  if (kb > HERO_MAX_KB) throw new Error(`${target} is ${kb.toFixed(0)} KB, over the ${HERO_MAX_KB} KB budget`)
}

mkdirSync(new URL('scripts/wallet-pass-art/', root), { recursive: true })
await renderLogo()
await renderHero()
