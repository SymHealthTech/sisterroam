import TravelStory from '@/models/TravelStory'
import { ok, fail, connectAndAuth, handleError } from '@/lib/apiHelpers'

export async function PATCH(request, { params }) {
  try {
    const session = await connectAndAuth()
    if (!session.user.isAdmin) return fail('Admin access required', 403)

    const { slug } = await params
    const body = await request.json()

    const story = await TravelStory.findOne({ slug })
    if (!story) return fail('Story not found', 404)

    if (body.isFeatured !== undefined) story.isFeatured = body.isFeatured
    if (body.isPublished !== undefined) story.isPublished = body.isPublished

    await story.save()
    return ok(story.toObject())
  } catch (e) {
    return handleError(e)
  }
}
