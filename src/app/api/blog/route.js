import BlogPost from '@/models/BlogPost'
import { ok, fail, connectAndAuth, handleError } from '@/lib/apiHelpers'
import { connectDB } from '@/lib/mongodb'
import { auth } from '@/lib/auth'
import { slugify } from '@/lib/utils'

const CATEGORIES = ['solo_travel', 'cycling', 'trekking', 'running', 'safety', 'culture', 'food', 'tips']

export async function GET(request) {
  try {
    await connectDB()
    await auth()

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const page     = Math.max(1, parseInt(searchParams.get('page')  ?? '1'))
    const limit    = Math.min(20, parseInt(searchParams.get('limit') ?? '9'))

    const filter = { isPublished: true }
    if (category && CATEGORIES.includes(category)) filter.category = category

    const [posts, total] = await Promise.all([
      BlogPost.find(filter)
        .sort({ publishedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('authorId', 'fullName username profilePhotoUrl verificationTier city')
        .lean(),
      BlogPost.countDocuments(filter),
    ])

    return ok({ posts, total, page, totalPages: Math.ceil(total / limit) })
  } catch (e) {
    return handleError(e)
  }
}

export async function POST(request) {
  try {
    const session = await connectAndAuth()
    const body = await request.json()
    const { title, content, coverImageUrl, coverImagePublicId, category, tags, excerpt, isPublished } = body

    if (!title?.trim())   return fail('Title is required', 400)
    if (!content?.trim()) return fail('Content is required', 400)

    const wordCount      = content.trim().split(/\s+/).length
    const readTimeMinutes = Math.ceil(wordCount / 200)
    const slug           = slugify(title) + '-' + Date.now()

    const post = await BlogPost.create({
      authorId: session.user.id,
      title:    title.trim(),
      slug,
      content,
      excerpt:             excerpt?.trim(),
      coverImageUrl,
      coverImagePublicId,
      category:            CATEGORIES.includes(category) ? category : undefined,
      tags:                Array.isArray(tags) ? tags.map(t => t.toLowerCase().trim()).filter(Boolean) : [],
      isPublished:         isPublished ?? false,
      publishedAt:         isPublished ? new Date() : undefined,
      readTimeMinutes,
    })

    return ok(post.toObject())
  } catch (e) {
    return handleError(e)
  }
}
