import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import CommunityPost from '@/models/CommunityPost'
import TravelStory from '@/models/TravelStory'
import Notification from '@/models/Notification'
import { deleteFile } from '@/lib/cloudinary'
import { sendEmail } from '@/lib/resend'

const KIND_LABELS = {
  profile_photo:   'A profile photo',
  community_image: 'A community post with photos',
  story_cover:     'A travel-story cover photo',
}

/**
 * Alert admins that a piece of member content is awaiting manual moderation.
 * Fires an in-app notification to every admin plus one email to ADMIN_EMAIL.
 * Best-effort and non-blocking — never throws into the request path.
 *
 * @param {{ kind: 'profile_photo'|'community_image'|'story_cover', detail?: string, link?: string }} opts
 */
export async function notifyAdminsOfPendingModeration({ kind, detail = '', link = '/admin/moderation' } = {}) {
  try {
    await connectDB()
    const label = KIND_LABELS[kind] ?? 'New content'
    const body  = `${label} is awaiting review${detail ? ` — ${detail}` : ''}.`

    const admins = await User.find({ isAdmin: true }).select('_id').lean()
    if (admins.length) {
      await Notification.insertMany(
        admins.map((a) => ({
          recipientId: a._id,
          type:  'moderation_pending',
          title: 'New content awaiting review',
          body,
          link,
        })),
      )
    }

    if (process.env.ADMIN_EMAIL) {
      const url = `${process.env.NEXTAUTH_URL ?? ''}${link}`
      sendEmail({
        to:      process.env.ADMIN_EMAIL,
        subject: 'SisterRoam — new content awaiting moderation',
        html:    `<p>${body}</p><p><a href="${url}">Open the moderation queue</a></p>`,
      }).catch(() => {})
    }
  } catch (e) {
    console.error('[notifyAdminsOfPendingModeration]', e.message)
  }
}

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
      // Rejected: drop the photo, fall back to initials, delete the asset,
      // and tell her so she can upload a different one.
      user.profilePhotoUrl = undefined
      user.profilePhotoPublicId = undefined
      user.profilePhotoStatus = 'rejected'
      await user.save()
      await deleteFile(publicId, 'image').catch(() => {})
      await Notification.create({
        recipientId: user._id,
        type:  'content_rejected',
        title: 'Your profile photo was rejected',
        body:  'The profile photo you uploaded didn’t meet our community guidelines and was removed. You can upload a different one from your profile.',
        link:  '/profile/edit',
      }).catch(() => {})
    }
    return { matched: true, kind: 'profile_photo' }
  }

  // ── Community post image (may hold up to 7 images) ─────────────
  const post = await CommunityPost.findOne({ imagePublicIds: publicId })
  if (post) {
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
      // Rejected: the whole post comes down with the image — delete every
      // attached image from Cloudinary, remove the post, and notify the author.
      for (const pid of post.imagePublicIds ?? []) {
        await deleteFile(pid, 'image').catch(() => {})
      }
      await CommunityPost.deleteOne({ _id: post._id })
      await Notification.create({
        recipientId: post.authorId,
        type:  'content_rejected',
        title: 'Your post was removed',
        body:  'A post you shared was removed by our team because an attached photo didn’t meet our community guidelines.',
        link:  '/feed',
      }).catch(() => {})
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
      await Notification.create({
        recipientId: story.authorId,
        type:  'content_rejected',
        title: 'Your story cover was rejected',
        body:  'The cover image on your travel story didn’t meet our community guidelines and was removed. Your story text is safe — you can add a different cover.',
        link:  story.slug ? `/stories/${story.slug}` : '/community/blog',
      }).catch(() => {})
    }
    return { matched: true, kind: 'story_cover' }
  }

  return { matched: false }
}
