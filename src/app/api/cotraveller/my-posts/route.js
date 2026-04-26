import CoTravelPost from '@/models/CoTravelPost'
import CoTravelInterest from '@/models/CoTravelInterest'
import { ok, connectAndAuth, handleError } from '@/lib/apiHelpers'

export async function GET() {
  try {
    const session = await connectAndAuth()
    const userId = session.user.id

    const posts = await CoTravelPost.find({ authorId: userId })
      .sort({ createdAt: -1 })
      .lean()

    // Attach interest counts
    const postIds = posts.map(p => p._id)
    const interests = await CoTravelInterest.aggregate([
      { $match: { postId: { $in: postIds } } },
      { $group: { _id: '$postId', count: { $sum: 1 } } },
    ])
    const countMap = Object.fromEntries(interests.map(i => [i._id.toString(), i.count]))

    const postsWithCounts = posts.map(p => ({
      ...p,
      interestedCount: countMap[p._id.toString()] ?? p.interestedCount ?? 0,
    }))

    return ok(postsWithCounts)
  } catch (e) {
    return handleError(e)
  }
}
