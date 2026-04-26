import TravelStory from '@/models/TravelStory'
import { ok, connectAndAuth, handleError } from '@/lib/apiHelpers'

export async function GET() {
  try {
    const session = await connectAndAuth()

    const stories = await TravelStory.find({ authorId: session.user.id })
      .sort({ updatedAt: -1 })
      .lean()

    return ok({ stories })
  } catch (e) {
    return handleError(e)
  }
}
