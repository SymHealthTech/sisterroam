import CoTravelInterest from '@/models/CoTravelInterest'
import { ok, connectAndAuth, handleError } from '@/lib/apiHelpers'

export async function GET() {
  try {
    const session = await connectAndAuth()
    const userId = session.user.id

    const interests = await CoTravelInterest.find({ interestedUserId: userId })
      .sort({ createdAt: -1 })
      .populate({
        path: 'postId',
        populate: {
          path: 'authorId',
          select: 'fullName profilePhotoUrl verificationTier city',
        },
      })
      .lean()

    const grouped = {
      pending:  interests.filter(i => i.status === 'pending'),
      accepted: interests.filter(i => i.status === 'accepted'),
      declined: interests.filter(i => i.status === 'declined'),
    }

    return ok(grouped)
  } catch (e) {
    return handleError(e)
  }
}
