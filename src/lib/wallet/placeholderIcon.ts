import { deflateSync } from 'node:zlib'

function crc32(buf: Buffer): number {
  const table: number[] = []
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const typeBuf = Buffer.from(type, 'ascii')
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

// Solid-color square PNG used as a stand-in wallet icon (Apple requires
// icon.png / icon@2x.png / icon@3x.png to exist, but doesn't care what's in
// them). Swap for real branded artwork before shipping — generated here
// rather than embedded as a base64 literal so it's guaranteed valid.
export function solidColorPng(size: number, [r, g, b]: [number, number, number]): Buffer {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(size, 0)
  ihdrData.writeUInt32BE(size, 4)
  ihdrData[8] = 8 // bit depth
  ihdrData[9] = 2 // color type: truecolor (RGB)
  const ihdr = chunk('IHDR', ihdrData)

  const rowLength = size * 3
  const raw = Buffer.alloc((rowLength + 1) * size)
  for (let y = 0; y < size; y++) {
    const rowStart = y * (rowLength + 1)
    raw[rowStart] = 0 // filter type: none
    for (let x = 0; x < size; x++) {
      const px = rowStart + 1 + x * 3
      raw[px] = r
      raw[px + 1] = g
      raw[px + 2] = b
    }
  }
  const idat = chunk('IDAT', deflateSync(raw))
  const iend = chunk('IEND', Buffer.alloc(0))

  return Buffer.concat([signature, ihdr, idat, iend])
}
