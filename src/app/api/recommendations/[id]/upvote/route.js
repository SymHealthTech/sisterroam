import Recommendation from '@/models/Recommendation'
import { ok, fail, connectAndAuth, handleError } from '@/lib/apiHelpers'
import mongoose from 'mongoose'

export async function POST(request, { params }) {
  try {
    const session = await connectAndAuth()
    const { id } = await params
    const userId = session.user.id

    const rec = await Recommendation.findById(id)
    if (!rec) return fail('Recommendation not found', 404)

    const userObjId = new mongoose.Types.ObjectId(userId)
    const hasUpvoted = rec.upvotes.some(uid => uid.equals(userObjId))

    if (hasUpvoted) {
      rec.upvotes.pull(userObjId)
      rec.upvoteCount = Math.max(0, rec.upvoteCount - 1)
    } else {
      rec.upvotes.push(userObjId)
      rec.upvoteCount += 1
    }

    await rec.save()
    return ok({ upvoted: !hasUpvoted, upvoteCount: rec.upvoteCount })
  } catch (e) {
    return handleError(e)
  }
}
