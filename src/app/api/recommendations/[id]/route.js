import Recommendation from '@/models/Recommendation'
import { ok, fail, connectAndAuth, handleError } from '@/lib/apiHelpers'
import { connectDB } from '@/lib/mongodb'
import { auth } from '@/lib/auth'

export async function GET(request, { params }) {
  try {
    await connectDB()
    const session = await auth()
    if (!session?.user?.id) return fail('Login required', 401)

    const { id } = await params
    const userId = session.user.id

    const rec = await Recommendation.findById(id)
      .populate('authorId', 'fullName profilePhotoUrl verificationTier city')
      .lean()

    if (!rec) return fail('Recommendation not found', 404)
    if (rec.isFlagged) return fail('This recommendation is not available', 404)

    return ok({
      ...rec,
      hasUpvoted: rec.upvotes?.some(uid => uid.toString() === userId) ?? false,
    })
  } catch (e) {
    return handleError(e)
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await connectAndAuth()
    const { id } = await params
    const userId = session.user.id
    const body = await request.json()

    const rec = await Recommendation.findById(id)
    if (!rec) return fail('Recommendation not found', 404)

    const isAuthor = rec.authorId.toString() === userId
    const isAdmin  = session.user.isAdmin

    if (!isAuthor && !isAdmin) return fail('Not authorised', 403)

    if (isAuthor && !isAdmin) {
      const hoursSinceCreation = (Date.now() - new Date(rec.createdAt).getTime()) / 3_600_000
      if (hoursSinceCreation > 24) return fail('You can only edit recommendations within 24 hours of posting', 403)
    }

    const editable = ['title', 'description', 'priceRange', 'approximatePrice', 'address', 'websiteUrl']
    if (isAdmin) editable.push('isFlagged')

    for (const key of editable) {
      if (body[key] !== undefined) rec[key] = body[key]
    }

    await rec.save()
    return ok(rec)
  } catch (e) {
    return handleError(e)
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await connectAndAuth()
    const { id } = await params
    const userId = session.user.id

    const rec = await Recommendation.findById(id)
    if (!rec) return fail('Recommendation not found', 404)

    if (rec.authorId.toString() !== userId && !session.user.isAdmin) {
      return fail('Not authorised', 403)
    }

    await rec.deleteOne()
    return ok({ deleted: true })
  } catch (e) {
    return handleError(e)
  }
}
