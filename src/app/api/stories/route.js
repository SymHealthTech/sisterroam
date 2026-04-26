import TravelStory from '@/models/TravelStory'
import { ok, fail, connectAndAuth, handleError } from '@/lib/apiHelpers'
import { connectDB } from '@/lib/mongodb'
import { auth } from '@/lib/auth'
import { slugify } from '@/lib/utils'

const CATEGORIES = [
  'solo_travel', 'cycling', 'trekking', 'running',
  'safety_experience', 'cultural_immersion', 'food_journey',
  'budget_travel', 'tips_and_advice', 'co_traveller_experience',
  'hosting_experience', 'destination_guide',
]

export async function GET(request) {
  try {
    await connectDB()
    const session = await auth()

    const { searchParams } = new URL(request.url)
    const page      = Math.max(1, parseInt(searchParams.get('page')  ?? '1'))
    const limit     = Math.min(20, parseInt(searchParams.get('limit') ?? '9'))
    const category  = searchParams.get('category')
    const tag       = searchParams.get('tag')
    const authorId  = searchParams.get('authorId')
    const sort      = searchParams.get('sort') ?? 'newest'
    const featured  = searchParams.get('featured')

    const filter = { isPublished: true }
    if (category && CATEGORIES.includes(category)) filter.category = category
    if (tag)      filter.tags = { $in: [tag] }
    if (authorId) filter.authorId = authorId
    if (featured === 'true') filter.isFeatured = true

    const sortMap = {
      newest:   { publishedAt: -1 },
      popular:  { viewsCount: -1, likesCount: -1 },
      featured: { isFeatured: -1, publishedAt: -1 },
    }
    const sortQuery = sortMap[sort] ?? sortMap.newest

    const [stories, total] = await Promise.all([
      TravelStory.find(filter)
        .sort(sortQuery)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('authorId', 'fullName username profilePhotoUrl city country verificationTier')
        .lean(),
      TravelStory.countDocuments(filter),
    ])

    // Attach isSaved for authenticated users
    const userId = session?.user?.id
    const enriched = stories.map(s => ({
      ...s,
      isSaved: userId ? s.saves?.some(id => id.toString() === userId) : false,
    }))

    return ok({ stories: enriched, total, page, totalPages: Math.ceil(total / limit) })
  } catch (e) {
    return handleError(e)
  }
}

export async function POST(request) {
  try {
    const session = await connectAndAuth()

    if (session.user.verificationTier === 'basic') {
      return fail(
        'Only verified members can share travel stories. Complete your verification to share your experience with the community.',
        403
      )
    }

    const body = await request.json()
    const { title, content, category, tags, excerpt, coverImageUrl, coverImagePublicId, isPublished } = body

    if (!title?.trim() || title.trim().length < 10) return fail('Title must be at least 10 characters', 400)
    if (!content?.trim() || content.trim().length < 200) return fail('Content must be at least 200 characters', 400)
    if (!category || !CATEGORIES.includes(category)) return fail('Valid category is required', 400)

    const wordCount       = content.trim().split(/\s+/).filter(Boolean).length
    const readTimeMinutes = Math.ceil(wordCount / 200)

    // Build unique slug
    let slug = slugify(title)
    const existing = await TravelStory.findOne({ slug }).select('slug').lean()
    if (existing) slug = slug + '-' + Date.now()

    // Auto-generate excerpt if not provided
    const autoExcerpt = excerpt?.trim()
      || content.replace(/<[^>]+>/g, '').slice(0, 160) + '…'

    const story = await TravelStory.create({
      authorId:           session.user.id,
      title:              title.trim(),
      slug,
      content,
      excerpt:            autoExcerpt,
      coverImageUrl,
      coverImagePublicId,
      category,
      tags:               Array.isArray(tags) ? tags.map(t => t.toLowerCase().trim()).filter(Boolean) : [],
      isPublished:        isPublished ?? false,
      publishedAt:        isPublished ? new Date() : undefined,
      readTimeMinutes,
    })

    return ok(story.toObject())
  } catch (e) {
    return handleError(e)
  }
}
