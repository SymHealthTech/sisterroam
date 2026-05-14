/**
 * Upload a file directly to Cloudinary from the browser.
 * The file never passes through our serverless function — only a small
 * signed-credential request (~5ms) hits our server.
 *
 * @param {File|Blob} file
 * @param {{ folder?: string, type?: string, resourceType?: 'image'|'video'|'raw' }} options
 * @returns {Promise<{ url: string, publicId: string }>}
 */
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
