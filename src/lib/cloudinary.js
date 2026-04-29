import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export default cloudinary

export async function uploadImage(file, options = {}) {
  const { folder = 'sisterroam', publicId, transformation } = options

  const defaultTransformation = [
    { width: 400, height: 400, crop: 'fill', gravity: 'face' },
    { format: 'webp', quality: 'auto' },
  ]

  const result = await cloudinary.uploader.upload(file, {
    folder,
    public_id: publicId,
    transformation: transformation ?? defaultTransformation,
    resource_type: 'image',
  })

  return {
    url:      result.secure_url,
    publicId: result.public_id,
    width:    result.width,
    height:   result.height,
  }
}

export async function uploadVideo(file, options = {}) {
  const { folder = 'sisterroam/verifications', publicId } = options

  const result = await cloudinary.uploader.upload(file, {
    folder,
    public_id:     publicId,
    resource_type: 'video',
  })

  return {
    url:      result.secure_url,
    publicId: result.public_id,
    duration: result.duration,
  }
}

export async function uploadDocument(file, options = {}) {
  const { folder = 'sisterroam/verifications/documents', publicId } = options

  const result = await cloudinary.uploader.upload(file, {
    folder,
    public_id:     publicId,
    resource_type: 'image',
    type:          'authenticated',
    transformation: [
      { width: 1920, height: 1920, crop: 'limit' },
      { format: 'webp', quality: 'auto:good' },
    ],
  })

  return {
    url:      result.secure_url,
    publicId: result.public_id,
  }
}

export async function deleteFile(publicId, resourceType = 'image') {
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
}

export async function getSignedUrl(publicId, resourceType = 'image') {
  return cloudinary.url(publicId, {
    type:          'authenticated',
    resource_type: resourceType,
    sign_url:      true,
    expires_at:    Math.floor(Date.now() / 1000) + 3600,
    secure:        true,
  })
}

export async function generateUploadSignature(folder = 'sisterroam', tags = []) {
  const timestamp = Math.round(Date.now() / 1000)
  const params = {
    folder,
    timestamp,
    ...(tags.length ? { tags: tags.join(',') } : {}),
  }
  const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET)

  return {
    signature,
    timestamp,
    apiKey:    process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  }
}
