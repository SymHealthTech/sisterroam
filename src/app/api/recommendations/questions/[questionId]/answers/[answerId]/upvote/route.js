import RecommendationAnswer from '@/models/RecommendationAnswer'
import { ok, fail, connectAndAuth, handleError } from '@/lib/apiHelpers'
import mongoose from 'mongoose'

export async function POST(request, { params }) {
  try {
    const session = await connectAndAuth()
    const { answerId } = await params
    const userId = session.user.id

    const answer = await RecommendationAnswer.findById(answerId)
    if (!answer) return fail('Answer not found', 404)

    const userObjId = new mongoose.Types.ObjectId(userId)
    const hasUpvoted = answer.upvotes.some(uid => uid.equals(userObjId))

    if (hasUpvoted) {
      answer.upvotes.pull(userObjId)
      answer.upvoteCount = Math.max(0, answer.upvoteCount - 1)
    } else {
      answer.upvotes.push(userObjId)
      answer.upvoteCount += 1
    }

    await answer.save()
    return ok({ upvoted: !hasUpvoted, upvoteCount: answer.upvoteCount })
  } catch (e) {
    return handleError(e)
  }
}
