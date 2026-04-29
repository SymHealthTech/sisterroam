import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import SafetyReport from '@/models/SafetyReport'
import TravelStory from '@/models/TravelStory'
import CommunityPost from '@/models/CommunityPost'
import { uploadImage, uploadVideo, uploadDocument } from '@/lib/cloudinary'

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
const VIDEO_TYPES = new Set(['video/mp4', 'video/quicktime', 'video/avi', 'video/webm'])

const IMAGE_MAX = 10 * 1024 * 1024   // 10 MB
const VIDEO_MAX = 100 * 1024 * 1024  // 100 MB

async function fileToDataUri(file) {
  const buffer = Buffer.from(await file.arrayBuffer())
  return `data:${file.type};base64,${buffer.toString('base64')}`
}

export async function POST(request) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id

  let formData
  try {
    formData = await request.formData()
  } catch {
    return Response.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file  = formData.get('file')
  const type  = formData.get('type')
  const extra = formData.get('extra') ?? null // slug | reportId | postId

  if (!file || typeof file === 'string') return Response.json({ error: 'No file provided' }, { status: 400 })
  if (!type) return Response.json({ error: 'Upload type required' }, { status: 400 })

  const isImage = IMAGE_TYPES.has(file.type)
  const isVideo = VIDEO_TYPES.has(file.type)

  if (!isImage && !isVideo) return Response.json({ error: 'Unsupported file type' }, { status: 415 })

  const maxBytes = isVideo ? VIDEO_MAX : IMAGE_MAX
  if (file.size > maxBytes)
    return Response.json({ error: `File too large. Max ${isVideo ? '100MB' : '10MB'}` }, { status: 413 })

  const dataUri = await fileToDataUri(file)
  await connectDB()

  try {
    switch (type) {
      case 'profile_photo': {
        const result = await uploadImage(dataUri, {
          folder: `sisterroam/profiles/${userId}`,
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            { format: 'webp', quality: 'auto' },
          ],
        })
        await User.findByIdAndUpdate(userId, {
          profilePhotoUrl:      result.url,
          profilePhotoPublicId: result.publicId,
        })
        return Response.json({ success: true, url: result.url, publicId: result.publicId })
      }

      case 'id_document': {
        if (!isImage) return Response.json({ error: 'Image file required' }, { status: 400 })
        const result = await uploadDocument(dataUri, {
          folder: `sisterroam/verifications/${userId}/id`,
        })
        return Response.json({ success: true, url: result.url, publicId: result.publicId })
      }

      case 'intro_video': {
        if (!isVideo) return Response.json({ error: 'Video file required' }, { status: 400 })
        const result = await uploadVideo(dataUri, {
          folder: `sisterroam/verifications/${userId}/video`,
        })
        return Response.json({ success: true, url: result.url, publicId: result.publicId })
      }

      case 'community_image': {
        if (!isImage) return Response.json({ error: 'Image file required' }, { status: 400 })
        const result = await uploadImage(dataUri, {
          folder: `sisterroam/community/${userId}`,
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        })
        if (extra) {
          await CommunityPost.findByIdAndUpdate(extra, {
            $push: { imageUrls: result.url, imagePublicIds: result.publicId },
          })
        }
        return Response.json({ success: true, url: result.url, publicId: result.publicId })
      }

      case 'blog_cover': {
        if (!isImage) return Response.json({ error: 'Image file required' }, { status: 400 })
        const result = await uploadImage(dataUri, {
          folder: `sisterroam/blog/${extra ?? userId}`,
          transformation: [
            { width: 1200, height: 630, crop: 'fill' },
            { format: 'webp', quality: 'auto' },
          ],
        })
        if (extra) {
          await TravelStory.findOneAndUpdate(
            { slug: extra },
            { coverImageUrl: result.url, coverImagePublicId: result.publicId }
          )
        }
        return Response.json({ success: true, url: result.url, publicId: result.publicId })
      }

      case 'safety_evidence': {
        if (!isImage) return Response.json({ error: 'Image file required' }, { status: 400 })
        const result = await uploadDocument(dataUri, {
          folder: `sisterroam/safety/${extra ?? userId}`,
        })
        if (extra) {
          await SafetyReport.findByIdAndUpdate(extra, {
            evidenceUrl:      result.url,
            evidencePublicId: result.publicId,
          })
        }
        return Response.json({ success: true, url: result.url, publicId: result.publicId })
      }

      default:
        return Response.json({ error: 'Unknown upload type' }, { status: 400 })
    }
  } catch (err) {
    console.error('[upload]', err)
    return Response.json({ error: 'Upload failed' }, { status: 500 })
  }
}
