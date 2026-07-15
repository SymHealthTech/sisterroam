/**
 * Upload a file directly to Cloudinary from the browser.
 * The file never passes through our serverless function — only a small
 * signed-credential request (~5ms) hits our server.
 *
 * @param {File|Blob} file
 * @param {{ folder?: string, type?: string, resourceType?: 'image'|'video'|'raw' }} options
 * @returns {Promise<{ url: string, publicId: string }>}
 */
/**
 * Downscale + re-encode an image File to WebP in the browser before upload,
 * to keep uploads small. Runs client-side only (uses canvas / Image).
 *
 * @param {File} file
 * @param {number} maxWidth
 * @param {number} quality
 * @returns {Promise<File>}
 */
export async function compressImage(file, maxWidth = 1200, quality = 0.75) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      let { width, height } = img
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width)
        width = maxWidth
      }
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' })),
        'image/webp',
        quality,
      )
    }
    img.src = url
  })
}

export async function directUpload(file, { folder = 'sisterroam', type = '', resourceType = 'image' } = {}) {
  const qs = new URLSearchParams({ folder })
  if (type) qs.set('type', type)

  const sigRes = await fetch(`/api/upload/signature?${qs}`)
  if (!sigRes.ok) throw new Error('Could not get upload credentials')
  const { signature, timestamp, apiKey, cloudName } = await sigRes.json()

  const fd = new FormData()
  fd.append('file', file)
  fd.append('api_key', apiKey)
  fd.append('timestamp', String(timestamp))
  fd.append('signature', signature)
  fd.append('folder', folder)
  if (type) fd.append('tags', type)

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    { method: 'POST', body: fd }
  )

  if (!uploadRes.ok) {
    const err = await uploadRes.json().catch(() => ({}))
    throw new Error(err.error?.message ?? 'Upload failed')
  }

  const data = await uploadRes.json()
  return { url: data.secure_url, publicId: data.public_id }
}
