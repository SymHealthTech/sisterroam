import TravelStory from '@/models/TravelStory'
import { ok, fail, connectAndAuth, handleError } from '@/lib/apiHelpers'

export async function POST(request, { params }) {
  try {
    await connectAndAuth()
    const { slug } = await params

    const story = await TravelStory.findOneAndUpdate(
      { slug },
      { $inc: { likesCount: 1 } },
      { new: true }
    ).select('likesCount').lean()

    if (!story) return fail('Story not found', 404)
    return ok({ likesCount: story.likesCount })
  } catch (e) {
    return handleError(e)
  }
}
