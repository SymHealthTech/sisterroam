import BlogPost from '@/models/BlogPost'
import { ok, fail, connectAndAuth, handleError } from '@/lib/apiHelpers'
import { connectDB } from '@/lib/mongodb'
import { auth } from '@/lib/auth'

export async function GET(request, { params }) {
  try {
    await connectDB()
    const session = await auth()
    const { slug } = await params

    const post = await BlogPost.findOne({ slug })
      .populate('authorId', 'fullName username profilePhotoUrl verificationTier city bio')
      .lean()

    if (!post) return fail('Post not found', 404)

    const isOwner = post.authorId._id.toString() === session?.user?.id
    if (!post.isPublished && !isOwner && !session?.user?.isAdmin) {
      return fail('Post not found', 404)
    }

    // Increment view count (fire-and-forget)
    BlogPost.findByIdAndUpdate(post._id, { $inc: { viewsCount: 1 } }).exec()

    const related = await BlogPost.find({
      isPublished: true,
      category:    post.category,
      _id:         { $ne: post._id },
    })
      .sort({ publishedAt: -1 })
      .limit(3)
      .populate('authorId', 'fullName username profilePhotoUrl')
      .lean()

    return ok({ post, related })
  } catch (e) {
    return handleError(e)
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await connectAndAuth()
    const { slug } = await params
    const body = await request.json()

    const post = await BlogPost.findOne({ slug })
    if (!post) return fail('Post not found', 404)
    if (post.authorId.toString() !== session.user.id && !session.user.isAdmin) {
      return fail('Not authorized', 403)
    }

    const ALLOWED = ['title', 'content', 'excerpt', 'coverImageUrl', 'coverImagePublicId', 'category', 'tags', 'isPublished']
    for (const key of ALLOWED) {
      if (body[key] !== undefined) post[key] = body[key]
    }
    if (body.isPublished && !post.publishedAt) post.publishedAt = new Date()
    if (body.content) {
      post.readTimeMinutes = Math.ceil(body.content.trim().split(/\s+/).length / 200)
    }

    await post.save()
    return ok(post.toObject())
  } catch (e) {
    return handleError(e)
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await connectAndAuth()
    const { slug } = await params

    const post = await BlogPost.findOne({ slug })
    if (!post) return fail('Post not found', 404)
    if (post.authorId.toString() !== session.user.id && !session.user.isAdmin) {
      return fail('Not authorized', 403)
    }

    await post.deleteOne()
    return ok({ deleted: true })
  } catch (e) {
    return handleError(e)
  }
}
