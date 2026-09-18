import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import CommunityPost from '@/models/CommunityPost'
import TravelStory from '@/models/TravelStory'
import { deleteFile } from '@/lib/cloudinary'

/**
 * Apply a Cloudinary manual-moderation decision to whatever record owns the
 * asset. Idempotent — safe to call from both the admin action and the webhook
 * for the same public_id.
 *
 * @param {string} publicId    Cloudinary public_id that was moderated
 * @param {'approved'|'rejected'} status
 * @param {'image'|'video'} [resourceType='image']
 * @returns {Promise<{ matched: boolean, kind?: string }>}
 */
export async function applyModerationDecision(publicId, status, resourceType = 'image') {
  if (!publicId || !['approved', 'rejected'].includes(status)) {
    return { matched: false }
  }
  await connectDB()

  // ── Profile photo ──────────────────────────────────────────────
  const user = await User.findOne({ profilePhotoPublicId: publicId })
  if (user) {
    if (status === 'approved') {
      user.profilePhotoStatus = 'approved'
      await user.save()
    } else {
      // Rejected: drop the photo, fall back to initials, delete the asset.
      user.profilePhotoUrl = undefined
      user.profilePhotoPublicId = undefined
      user.profilePhotoStatus = 'rejected'
      await user.save()
      await deleteFile(publicId, 'image').catch(() => {})
    }
    return { matched: true, kind: 'profile_photo' }
  }

  // ── Community post image (may hold up to 7 images) ─────────────
  const post = await CommunityPost.findOne({ imagePublicIds: publicId })
  if (post) {
    const idx = post.imagePublicIds.indexOf(publicId)
    if (status === 'approved') {
      if (!post.approvedImagePublicIds.includes(publicId)) {
        post.approvedImagePublicIds.push(publicId)
      }
      // Whole post is shown only once every image is individually approved.
      const allApproved = post.imagePublicIds.every((id) =>
        post.approvedImagePublicIds.includes(id),
      )
      post.moderationStatus = allApproved ? 'approved' : 'pending'
      await post.save()
    } else {
      // Rejected: remove just this image (keep the rest + the text).
      if (idx !== -1) {
        post.imageUrls.splice(idx, 1)
        post.imagePublicIds.splice(idx, 1)
      }
      post.approvedImagePublicIds = post.approvedImagePublicIds.filter((id) => id !== publicId)
      const allApproved =
        post.imagePublicIds.length === 0 ||
        post.imagePublicIds.every((id) => post.approvedImagePublicIds.includes(id))
      post.moderationStatus = allApproved ? 'approved' : 'pending'
      await post.save()
      await deleteFile(publicId, 'image').catch(() => {})
    }
    return { matched: true, kind: 'community_image' }
  }

  // ── Travel-story cover ─────────────────────────────────────────
  const story = await TravelStory.findOne({ coverImagePublicId: publicId })
  if (story) {
    if (status === 'approved') {
      story.coverModerationStatus = 'approved'
      await story.save()
    } else {
      story.coverImageUrl = undefined
      story.coverImagePublicId = undefined
      story.coverModerationStatus = 'rejected'
      await story.save()
      await deleteFile(publicId, 'image').catch(() => {})
    }
    return { matched: true, kind: 'story_cover' }
  }

  return { matched: false }
}
