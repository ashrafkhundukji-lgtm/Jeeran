'use client'

export class ImageDecodeError extends Error {}

// Client-side downscale before upload: phone photos are routinely 4–12 MB,
// which is slow on mobile data and can exceed the upload route's limit.
// Longest side capped at `maxSide`, re-encoded as JPEG (or kept as PNG
// when the source is a PNG, to preserve transparency). Images already
// within bounds and under `passThroughBytes` are sent as-is. Throws
// ImageDecodeError when the browser can't decode the file (e.g. a
// non-image, or HEIC on a browser without HEIC support).
export async function downscaleImage(file: File, maxSide = 1280, passThroughBytes = 900_000): Promise<File> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions)
  } catch {
    throw new ImageDecodeError('decode')
  }
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  if (scale === 1 && file.size <= passThroughBytes && /^image\/(jpeg|png|webp)$/.test(file.type)) {
    bitmap.close()
    return file
  }
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new ImageDecodeError('canvas')
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()
  const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.85))
  if (!blob) throw new ImageDecodeError('encode')
  const name = file.name.replace(/\.[^.]+$/, '') + (type === 'image/png' ? '.png' : '.jpg')
  return new File([blob], name, { type })
}
