// Renders the app icon, Android adaptive icon layers and splash image from
// the Jeeran mark (public/design/jeeran-mark-navy.svg geometry).
// Run from the repo root: node mobile/scripts/generate-icons.mjs
// (sharp comes from the website's node_modules; the app never ships it).
import sharp from 'sharp'
import { Buffer } from 'node:buffer'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'images')
mkdirSync(out, { recursive: true })

const NAVY = '#1E3A8A'
const CORAL = '#FF6B4A'
const CREAM = '#FFF8F1'

// The mark's own viewBox is 75 95 215 235 (w 215, h 235).
function mark({ stroke = NAVY, pin = CORAL, dot = CREAM } = {}) {
  return `
  <path d="M 100 110 L 260 110" stroke="${stroke}" stroke-width="24" stroke-linecap="round"/>
  <path d="M 230 110 C 230 110, 280 180, 230 250 C 180 320, 90 290, 90 220" fill="none" stroke="${stroke}" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M 230 110 L 230 180" stroke="${stroke}" stroke-width="24" stroke-linecap="round"/>
  <g transform="translate(160, 205)">
    <path d="M 0 0 C -12 -12, -18 -24, -18 -36 C -18 -50, -8 -58, 0 -58 C 8 -58, 18 -50, 18 -36 C 18 -24, 12 -12, 0 0 Z" fill="${pin}"/>
    <circle cx="0" cy="-36" r="6" fill="${dot}"/>
  </g>`
}

// size: canvas px; scale: mark height as a fraction of the canvas.
function svg(size, scale, { bg = null, ...colors } = {}) {
  const h = size * scale
  const w = (h * 215) / 235
  const x = (size - w) / 2
  const y = (size - h) / 2
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${bg ? `<rect width="${size}" height="${size}" fill="${bg}"/>` : ''}
  <svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="75 95 215 235">${mark(colors)}</svg>
</svg>`)
}

async function png(name, buf) {
  await sharp(buf).png().toFile(join(out, name))
  console.log('wrote', name)
}

// Legacy/store icon: full-bleed cream square, mark ~56% tall.
await png('icon.png', svg(1024, 0.56, { bg: CREAM }))
// Adaptive icon: 108dp canvas, launchers mask to the inner 72dp (66.7%) and
// the guaranteed-visible circle is ~61%. Mark height 44% keeps the whole
// mark (including the stroke caps) inside that circle.
await png('android-icon-foreground.png', svg(1024, 0.44))
await png(
  'android-icon-background.png',
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="1024" height="1024" fill="${CREAM}"/></svg>`),
)
// Themed (monochrome) icon: single colour, alpha only.
await png('android-icon-monochrome.png', svg(1024, 0.44, { stroke: '#000000', pin: '#000000', dot: 'transparent' }))
// Splash: mark on transparent, the splash background colour is cream.
await png('splash-icon.png', svg(1024, 0.8))
await png('favicon.png', svg(196, 0.7, { bg: CREAM }))
