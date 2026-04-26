import TravelStory from '@/models/TravelStory'
import { ok, handleError } from '@/lib/apiHelpers'
import { connectDB } from '@/lib/mongodb'

export async function GET() {
  try {
    await connectDB()

    let stories = await TravelStory.find({ isPublished: true, isFeatured: true })
      .sort({ publishedAt: -1 })
      .limit(3)
      .populate('authorId', 'fullName username profilePhotoUrl city country verificationTier')
      .lean()

    // Fill with most-viewed if fewer than 3 featured
    if (stories.length < 3) {
      const featuredIds = stories.map(s => s._id)
      const fill = await TravelStory.find({
        isPublished: true,
        _id: { $nin: featuredIds },
      })
        .sort({ viewsCount: -1 })
        .limit(3 - stories.length)
        .populate('authorId', 'fullName username profilePhotoUrl city country verificationTier')
        .lean()
      stories = [...stories, ...fill]
    }

    return ok({ stories })
  } catch (e) {
    return handleError(e)
  }
}
