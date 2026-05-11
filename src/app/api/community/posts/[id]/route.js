import mongoose from 'mongoose'
import CommunityPost from '@/models/CommunityPost'
import CommunityComment from '@/models/CommunityComment'
import { ok, fail, connectAndAuth, handleError } from '@/lib/apiHelpers'
import { deleteFile } from '@/lib/cloudinary'

export async function GET(request, { params }) {
  try {
    const session = await connectAndAuth()
    const { id } = await params

    const post = await CommunityPost.findById(id)
      .populate('authorId', 'fullName username profilePhotoUrl verificationTier city')
      .lean()

    if (!post || !post.isPublished) return fail('Post not found', 404)

    return ok({
      ...post,
      hasLiked: post.likes?.some(l => l.toString() === session.user.id),
    })
  } catch (e) {
    return handleError(e)
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await connectAndAuth()
    const { id } = await params
    const body = await request.json()

    const post = await CommunityPost.findById(id)
    if (!post || !post.isPublished) return fail('Post not found', 404)

    // Like toggle
    if (body.action === 'like') {
      const uid = new mongoose.Types.ObjectId(session.user.id)
      const hasLiked = post.likes.some(l => l.toString() === session.user.id)
      if (hasLiked) {
        post.likes.pull(uid)
        post.likesCount = Math.max(0, post.likesCount - 1)
      } else {
        post.likes.push(uid)
        post.likesCount += 1
      }
      await post.save()
      return ok({ hasLiked: !hasLiked, likesCount: post.likesCount })
    }

    // Edit — author only
    if (post.authorId.toString() !== session.user.id) return fail('Not authorized', 403)
    if (body.content !== undefined) {
      if (!body.content.trim()) return fail('Content cannot be empty', 400)
      post.content = body.content.trim()
    }
    if (body.category !== undefined) post.category = body.category
    await post.save()
    return ok(post.toObject())
  } catch (e) {
    return handleError(e)
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await connectAndAuth()
    const { id } = await params

    const post = await CommunityPost.findById(id)
    if (!post) return fail('Post not found', 404)
    if (post.authorId.toString() !== session.user.id && !session.user.isAdmin) {
      return fail('Not authorized', 403)
    }

    const publicIds = post.imagePublicIds?.filter(Boolean) ?? []
    await post.deleteOne()
    await Promise.all([
      CommunityComment.deleteMany({ postId: id }),
      ...publicIds.map(pid => deleteFile(pid).catch(() => null)),
    ])

    return ok({ deleted: true })
  } catch (e) {
    return handleError(e)
  }
}
