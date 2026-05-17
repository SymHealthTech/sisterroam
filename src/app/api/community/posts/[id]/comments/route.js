import CommunityPost from '@/models/CommunityPost'
import CommunityComment from '@/models/CommunityComment'
import { ok, fail, connectAndAuth, requireVerified, handleError } from '@/lib/apiHelpers'

export async function GET(request, { params }) {
  try {
    await connectAndAuth()
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const limit = Math.min(50, parseInt(searchParams.get('limit') ?? '20'))

    const comments = await CommunityComment.find({ postId: id, isDeleted: false })
      .sort({ createdAt: 1 })
      .limit(limit)
      .populate('authorId', 'fullName username profilePhotoUrl verificationTier')
      .lean()

    return ok(comments, { 'Cache-Control': 's-maxage=30, stale-while-revalidate=120' })
  } catch (e) {
    return handleError(e)
  }
}

export async function POST(request, { params }) {
  try {
    const session = await connectAndAuth()
    requireVerified(session)
    const { id } = await params
    const { content } = await request.json()

    if (!content?.trim())    return fail('Comment cannot be empty', 400)
    if (content.length > 500) return fail('Comment too long — max 500 characters', 400)

    const post = await CommunityPost.findById(id)
    if (!post || !post.isPublished) return fail('Post not found', 404)

    const comment = await CommunityComment.create({
      postId:   id,
      authorId: session.user.id,
      content:  content.trim(),
    })

    post.commentsCount += 1
    await post.save()

    const populated = await CommunityComment.findById(comment._id)
      .populate('authorId', 'fullName username profilePhotoUrl verificationTier')
      .lean()

    return ok(populated)
  } catch (e) {
    return handleError(e)
  }
}
