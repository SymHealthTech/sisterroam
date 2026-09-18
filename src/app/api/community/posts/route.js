import mongoose from 'mongoose'
import CommunityPost from '@/models/CommunityPost'
import { ok, fail, connectAndAuth, handleError, isVerifiedMember } from '@/lib/apiHelpers'
import { connectDB } from '@/lib/mongodb'
import { auth } from '@/lib/auth'
import { notifyAdminsOfPendingModeration } from '@/lib/moderation'

const CATEGORIES = ['general', 'safety_tips', 'trip_planning', 'looking_for_host', 'hosting_offer', 'achievements', 'questions', 'safety_brief', 'guide', 'founder_log', 'ask_community']

export async function GET(request) {
  try {
    await connectDB()
    const session = await auth()
    const userId = session?.user?.id

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const page     = Math.max(1, parseInt(searchParams.get('page')  ?? '1'))
    const limit    = Math.min(20, Math.max(1, parseInt(searchParams.get('limit') ?? '10')))

    const uid = userId ? String(userId) : null

    const filter = { isPublished: true }
    if (category && CATEGORIES.includes(category)) filter.category = category

    // A post with attached photos is held for moderation (moderationStatus
    // 'pending') and stays hidden from the public feed until an admin approves
    // it. Its own author still sees it — with an "under review" badge — so she
    // knows it was posted. Text-only posts are 'approved' and show normally.
    filter.$or = uid
      ? [{ moderationStatus: { $ne: 'pending' } }, { authorId: uid }]
      : [{ moderationStatus: { $ne: 'pending' } }]

    const [posts, total] = await Promise.all([
      CommunityPost.find(filter)
        .sort({ isPinned: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('authorId', 'fullName username profilePhotoUrl verificationTier city')
        .lean(),
      CommunityPost.countDocuments(filter),
    ])

    const postsOut = posts.map(p => ({
      ...p,
      hasLiked: uid ? p.likes?.some(id => id.toString() === uid) : false,
    }))

    return ok({ posts: postsOut, total, page, totalPages: Math.ceil(total / limit) })
  } catch (e) {
    return handleError(e)
  }
}

export async function POST(request) {
  try {
    const session = await connectAndAuth()
    const body = await request.json()
    const { content, category, imageUrls = [], imagePublicIds = [] } = body

    if (!content?.trim())    return fail('Content is required', 400)
    // Only verified members may attach photos. Unverified members can still post
    // text (e.g. to introduce themselves).
    if (imageUrls.length > 0 && !isVerifiedMember(session)) {
      return fail('Only verified members can add photos. You can still share a text post.', 403)
    }
    if (imageUrls.length > 7) return fail('Maximum 7 images allowed', 400)

    const post = await CommunityPost.create({
      authorId: session.user.id,
      content:  content.trim(),
      category: CATEGORIES.includes(category) ? category : 'general',
      imageUrls,
      imagePublicIds,
      // Images are public + manually moderated — hold the post's images until an
      // admin approves them. Text-only posts stay 'approved' and show normally.
      moderationStatus: imageUrls.length > 0 ? 'pending' : 'approved',
    })

    // A post with photos is held for moderation — alert admins so they can review it.
    if (post.moderationStatus === 'pending') {
      notifyAdminsOfPendingModeration({
        kind:   'community_image',
        detail: `${imageUrls.length} photo${imageUrls.length === 1 ? '' : 's'} to review`,
      }).catch(() => {})
    }

    const populated = await CommunityPost.findById(post._id)
      .populate('authorId', 'fullName username profilePhotoUrl verificationTier city')
      .lean()

    return ok({ ...populated, hasLiked: false })
  } catch (e) {
    return handleError(e)
  }
}
