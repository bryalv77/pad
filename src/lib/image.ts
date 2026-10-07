/** Largest file the user may pick; it is always re-encoded smaller before being stored. */
export const MAX_INPUT_BYTES = 10 * 1024 * 1024
/** Target size of the stored base64 data URL. */
const TARGET_CHARS = 250_000
const MAX_SIDE = 1600
const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

export const IMAGE_ACCEPT = ACCEPTED.join(',')

export class ImageError extends Error {}

const encode = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  canvas.toDataURL(type, quality)

/**
 * Validates, downscales and re-encodes an image into a compact data URL.
 * SVG is rejected on purpose (it can carry scripts); animated GIFs become still images.
 */
export async function imageToDataUrl(file: File): Promise<string> {
  if (!ACCEPTED.includes(file.type)) throw new ImageError('Use a PNG, JPEG, WebP or GIF image.')
  if (file.size > MAX_INPUT_BYTES) throw new ImageError('Images can be up to 10 MB.')

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new ImageError('That image could not be read.')
  }

  let scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  try {
    for (let attempt = 0; attempt < 8; attempt++) {
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(bitmap.width * scale))
      canvas.height = Math.max(1, Math.round(bitmap.height * scale))
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new ImageError('Your browser cannot process images.')
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

      // WebP keeps transparency and is small; Safari can't encode it, so fall back to JPEG.
      let url = encode(canvas, 'image/webp', 0.8 - attempt * 0.06)
      if (!url.startsWith('data:image/webp')) {
        ctx.globalCompositeOperation = 'destination-over'
        ctx.fillStyle = '#fff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        url = encode(canvas, 'image/jpeg', 0.8 - attempt * 0.06)
      }
      if (url.length <= TARGET_CHARS) return url
      scale *= 0.8
    }
  } finally {
    bitmap.close()
  }
  throw new ImageError('That image is too complex to compress enough.')
}
