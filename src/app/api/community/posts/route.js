import mongoose from 'mongoose'
import CommunityPost from '@/models/CommunityPost'
import { ok, fail, connectAndAuth, handleError } from '@/lib/apiHelpers'
import { connectDB } from '@/lib/mongodb'
import { auth } from '@/lib/auth'

const CATEGORIES = ['general', 'safety_tips', 'trip_planning', 'looking_for_host', 'hosting_offer', 'achievements', 'questions']

export async function GET(request) {
  try {
    await connectDB()
    const session = await auth()
    const userId = session?.user?.id

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const page     = Math.max(1, parseInt(searchParams.get('page')  ?? '1'))
    const limit    = Math.min(20, Math.max(1, parseInt(searchParams.get('limit') ?? '10')))

    const filter = { isPublished: true }
    if (category && CATEGORIES.includes(category)) filter.category = category

    const [posts, total] = await Promise.all([
      CommunityPost.find(filter)
        .sort({ isPinned: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('authorId', 'fullName username profilePhotoUrl verificationTier city')
        .lean(),
      CommunityPost.countDocuments(filter),
    ])

    const uid = userId ? String(userId) : null
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
    if (imageUrls.length > 7) return fail('Maximum 7 images allowed', 400)

    const post = await CommunityPost.create({
      authorId: session.user.id,
      content:  content.trim(),
      category: CATEGORIES.includes(category) ? category : 'general',
      imageUrls,
      imagePublicIds,
    })

    const populated = await CommunityPost.findById(post._id)
      .populate('authorId', 'fullName username profilePhotoUrl verificationTier city')
      .lean()

    return ok({ ...populated, hasLiked: false })
  } catch (e) {
    return handleError(e)
  }
}
