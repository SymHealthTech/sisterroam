import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export default cloudinary

export async function uploadImage(file, folder = 'sisterroam') {
  const result = await cloudinary.uploader.upload(file, {
    folder,
    resource_type: 'auto',
  })
  return result
}

export async function deleteImage(publicId) {
  return cloudinary.uploader.destroy(publicId)
}
