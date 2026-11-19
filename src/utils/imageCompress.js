const DEFAULT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

/**
 * Nén ảnh phía client (canvas) trước khi upload — mục tiêu ≤ maxBytes.
 * @param {File} file
 * @param {{ maxBytes?: number, maxEdge?: number, mime?: string }} [opts]
 * @returns {Promise<Blob>}
 */
export async function compressImageFile(file, opts = {}) {
  const maxBytes = opts.maxBytes ?? 5 * 1024 * 1024
  const maxEdge = opts.maxEdge ?? 1600
  const outMime = opts.mime || 'image/jpeg'

  if (!file || !DEFAULT_TYPES.has(file.type)) {
    throw new Error('IMAGE_FORMAT')
  }

  const bitmap = await loadImageBitmap(file)
  const { width, height } = fitInside(bitmap.width, bitmap.height, maxEdge)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('CANVAS_UNSUPPORTED')
  ctx.drawImage(bitmap, 0, 0, width, height)
  if (bitmap.close) bitmap.close()

  let quality = 0.88
  let blob = await canvasToBlob(canvas, outMime, quality)
  while (blob.size > maxBytes && quality > 0.42) {
    quality -= 0.08
    blob = await canvasToBlob(canvas, outMime, quality)
  }

  if (blob.size > maxBytes) {
    throw new Error('IMAGE_TOO_LARGE')
  }
  return blob
}

function fitInside(w, h, maxEdge) {
  const scale = Math.min(1, maxEdge / Math.max(w, h, 1))
  return {
    width: Math.max(1, Math.round(w * scale)),
    height: Math.max(1, Math.round(h * scale)),
  }
}

function loadImageBitmap(file) {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file)
  }
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('IMAGE_DECODE'))
    }
    img.src = url
  })
}

function canvasToBlob(canvas, mime, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('ENCODE_FAILED'))),
      mime,
      quality,
    )
  })
}

export const GREETING_IMAGE_MAX_BYTES = 5 * 1024 * 1024
export const GREETING_IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif'