import RecommendationQuestion from '@/models/RecommendationQuestion'
import { ok, fail, connectAndAuth, requireVerified, handleError } from '@/lib/apiHelpers'
import { connectDB } from '@/lib/mongodb'
import { auth } from '@/lib/auth'

const CATEGORIES = ['stay', 'food', 'transport', 'safety', 'activity', 'general']

export async function GET(request) {
  try {
    await connectDB()
    const session = await auth()
    const { searchParams } = new URL(request.url)
    const city     = searchParams.get('city')
    const country  = searchParams.get('country')
    const category = searchParams.get('category')
    const status   = searchParams.get('status')
    const page     = Math.max(1, parseInt(searchParams.get('page')  ?? '1'))
    const limit    = Math.min(20, Math.max(1, parseInt(searchParams.get('limit') ?? '10')))

    const query = {}
    if (city)    query.city    = { $regex: city,    $options: 'i' }
    if (country) query.country = { $regex: country, $options: 'i' }
    if (category && CATEGORIES.includes(category)) query.category = category
    if (status && ['open', 'resolved', 'closed'].includes(status)) query.status = status

    const [questions, total] = await Promise.all([
      RecommendationQuestion.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('authorId', 'fullName profilePhotoUrl verificationTier city')
        .lean(),
      RecommendationQuestion.countDocuments(query),
    ])

    return ok({ questions, total, page, totalPages: Math.ceil(total / limit) })
  } catch (e) {
    return handleError(e)
  }
}

export async function POST(request) {
  try {
    const session = await connectAndAuth()
    requireVerified(session)
    const userId  = session.user.id
    const body    = await request.json()

    const { city, country, countryCode, question, context, category } = body

    if (!city?.trim())     return fail('City is required', 400)
    if (!country?.trim())  return fail('Country is required', 400)
    if (!question?.trim()) return fail('Question is required', 400)
    if (question.trim().length < 20) return fail('Question must be at least 20 characters', 400)

    const q = await RecommendationQuestion.create({
      authorId: userId,
      city: city.trim(),
      country: country.trim(),
      countryCode,
      question: question.trim(),
      context: context?.trim(),
      category: category && CATEGORIES.includes(category) ? category : undefined,
    })

    const populated = await RecommendationQuestion.findById(q._id)
      .populate('authorId', 'fullName profilePhotoUrl verificationTier city')
      .lean()

    return ok(populated)
  } catch (e) {
    return handleError(e)
  }
}
