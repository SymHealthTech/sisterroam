import TravelStory from '@/models/TravelStory'
import { ok, fail, connectAndAuth, handleError } from '@/lib/apiHelpers'

export async function POST(request, { params }) {
  try {
    const session = await connectAndAuth()
    const { slug } = await params
    const userId = session.user.id

    const story = await TravelStory.findOne({ slug })
    if (!story) return fail('Story not found', 404)

    const alreadySaved = story.saves.some(id => id.toString() === userId)

    if (alreadySaved) {
      story.saves.pull(userId)
      story.saveCount = Math.max(0, story.saveCount - 1)
    } else {
      story.saves.push(userId)
      story.saveCount = story.saveCount + 1
    }

    await story.save()
    return ok({ isSaved: !alreadySaved, saveCount: story.saveCount })
  } catch (e) {
    return handleError(e)
  }
}
