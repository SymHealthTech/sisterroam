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
  if (!sigRes.ok) {
    const err = await sigRes.json().catch(() => ({}))
    throw new Error(err.error ?? 'Could not get upload credentials')
  }
  const { signature, timestamp, apiKey, cloudName, params = {} } = await sigRes.json()

  const fd = new FormData()
  fd.append('file', file)
  fd.append('api_key', apiKey)
  fd.append('timestamp', String(timestamp))
  fd.append('signature', signature)
  fd.append('folder', folder)
  if (type) fd.append('tags', type)
  // Append any server-signed extras (e.g. moderation=manual) exactly as signed.
  for (const [k, v] of Object.entries(params)) fd.append(k, String(v))

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

/**
 * Upload a video blob straight to Cloudinary (bypasses the serverless body-size
 * limit). Used to send the held intro video after payment succeeds. Appends any
 * server-signed extras (e.g. type=authenticated → private video).
 *
 * @param {Blob|File} blob
 * @param {string} [fileName='intro.webm']
 * @param {(pct:number)=>void} [onProgress]
 * @returns {Promise<{ url: string, publicId: string }>}
 */
export async function directUploadVideo(blob, fileName = 'intro.webm', onProgress) {
  const sigRes = await fetch('/api/upload/signature?folder=sisterroam/verifications/videos')
  if (!sigRes.ok) {
    const err = await sigRes.json().catch(() => ({}))
    throw new Error(err.error ?? 'Could not start upload. Please try again.')
  }
  const { signature, timestamp, apiKey, cloudName, params = {} } = await sigRes.json()

  const fd = new FormData()
  fd.append('file', blob, fileName)
  fd.append('folder', 'sisterroam/verifications/videos')
  fd.append('timestamp', String(timestamp))
  fd.append('signature', signature)
  fd.append('api_key', apiKey)
  for (const [k, v] of Object.entries(params)) fd.append(k, String(v))

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText)
        if (xhr.status >= 200 && xhr.status < 300) resolve({ url: data.secure_url, publicId: data.public_id })
        else reject(new Error(data?.error?.message ?? 'Upload failed'))
      } catch {
        reject(new Error('Upload failed. Please try again.'))
      }
    }
    xhr.onerror = () => reject(new Error('Network error'))
    xhr.ontimeout = () => reject(new Error('Upload timed out. Try a shorter video.'))
    xhr.timeout = 300000
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`)
    xhr.send(fd)
  })
}
