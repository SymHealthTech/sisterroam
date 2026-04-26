import TravelStory from '@/models/TravelStory'
import { ok, fail, connectAndAuth, handleError } from '@/lib/apiHelpers'
import { connectDB } from '@/lib/mongodb'
import { auth } from '@/lib/auth'
import { deleteFile } from '@/lib/cloudinary'

const ALLOWED_FIELDS = [
  'title', 'content', 'excerpt', 'coverImageUrl', 'coverImagePublicId',
  'category', 'tags', 'isPublished',
]

export async function GET(request, { params }) {
  try {
    await connectDB()
    const session = await auth()
    const { slug } = await params

    const story = await TravelStory.findOneAndUpdate(
      { slug, isPublished: true },
      { $inc: { viewsCount: 1 } },
      { new: true }
    )
      .populate('authorId', 'fullName username profilePhotoUrl city country verificationTier bio totalStays')
      .lean()

    if (!story) return fail('Story not found', 404)

    const related = await TravelStory.find({
      isPublished: true,
      category:    story.category,
      _id:         { $ne: story._id },
    })
      .sort({ publishedAt: -1 })
      .limit(3)
      .populate('authorId', 'fullName username profilePhotoUrl')
      .lean()

    const userId  = session?.user?.id
    const isSaved = userId ? story.saves?.some(id => id.toString() === userId) : false

    return ok({ story: { ...story, isSaved }, related })
  } catch (e) {
    return handleError(e)
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await connectAndAuth()
    const { slug } = await params
    const body = await request.json()

    const story = await TravelStory.findOne({ slug })
    if (!story) return fail('Story not found', 404)
    if (story.authorId.toString() !== session.user.id && !session.user.isAdmin) {
      return fail('Not authorized', 403)
    }

    const wasPublished = story.isPublished
    for (const key of ALLOWED_FIELDS) {
      if (body[key] !== undefined) story[key] = body[key]
    }
    if (body.isPublished && !wasPublished && !story.publishedAt) {
      story.publishedAt = new Date()
    }

    await story.save()
    return ok(story.toObject())
  } catch (e) {
    return handleError(e)
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await connectAndAuth()
    const { slug } = await params

    const story = await TravelStory.findOne({ slug })
    if (!story) return fail('Story not found', 404)
    if (story.authorId.toString() !== session.user.id && !session.user.isAdmin) {
      return fail('Not authorized', 403)
    }

    if (story.coverImagePublicId) {
      try { await deleteFile(story.coverImagePublicId) } catch {}
    }

    await story.deleteOne()
    return ok({ deleted: true })
  } catch (e) {
    return handleError(e)
  }
}
