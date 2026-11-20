// Owner app icons from the Jeeran mark (public/design/jeeran-mark-navy.svg):
// navy mark on cream, no text.
//
//   node scripts/generate-owner-app-icons.mjs
//
// Writes public/owner-app/:
//   icon-192.png, icon-512.png        purpose "any" (mark ~68% of the square)
//   icon-maskable-512.png             purpose "maskable": the whole mark sits
//                                     inside the 80% safe-zone circle
//   apple-touch-icon-180.png          iOS home screen (iOS adds its own mask)
//   badge-96.png                      Android status-bar badge: white mark on
//                                     transparent (Android uses alpha only)
import { readFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'public', 'owner-app')
mkdirSync(outDir, { recursive: true })

const CREAM = '#FFF8F1'
const markSvg = readFileSync(join(root, 'public', 'design', 'jeeran-mark-navy.svg'), 'utf8')
// viewBox="75 95 215 235": 215 wide, 235 tall.
const MARK_W = 215
const MARK_H = 235

async function renderMark(svg, height) {
  const width = Math.round((height * MARK_W) / MARK_H)
  const sized = svg.replace(/width="[^"]*"/, `width="${width}"`).replace(/height="[^"]*"/, `height="${height}"`)
  return sharp(Buffer.from(sized), { density: 600 }).resize(width, height).png().toBuffer()
}

async function iconOnCream(size, markHeightRatio, file) {
  const mark = await renderMark(markSvg, Math.round(size * markHeightRatio))
  await sharp({ create: { width: size, height: size, channels: 4, background: CREAM } })
    .composite([{ input: mark, gravity: 'center' }])
    .png()
    .toFile(join(outDir, file))
  console.log('wrote', file)
}

// "any": generous mark. Maskable: mark box 0.5 x 0.457 of the square has a
// diagonal of 0.68 — inside the 0.8 safe-zone circle with margin.
await iconOnCream(192, 0.68, 'icon-192.png')
await iconOnCream(512, 0.68, 'icon-512.png')
await iconOnCream(512, 0.5, 'icon-maskable-512.png')
await iconOnCream(180, 0.62, 'apple-touch-icon-180.png')

// Badge: every stroke/fill white, the pin's eye cut out.
const white = markSvg
  .replace(/#1E3A8A/gi, '#FFFFFF')
  .replace(/#FF6B4A/gi, '#FFFFFF')
  .replace(/<circle[^>]*fill="#FFF8F1"[^>]*>(<\/circle>)?/i, '')
const badgeMark = await renderMark(white, 80)
await sharp({ create: { width: 96, height: 96, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: badgeMark, gravity: 'center' }])
  .png()
  .toFile(join(outDir, 'badge-96.png'))
console.log('wrote badge-96.png')
