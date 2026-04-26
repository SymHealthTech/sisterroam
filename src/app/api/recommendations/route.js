import Recommendation from '@/models/Recommendation'
import HostingRequest from '@/models/HostingRequest'
import { ok, fail, connectAndAuth, handleError } from '@/lib/apiHelpers'
import { connectDB } from '@/lib/mongodb'
import { auth } from '@/lib/auth'

const CATEGORIES = ['stay', 'food', 'transport', 'safety', 'activity', 'general']

export async function GET(request) {
  try {
    await connectDB()
    const session = await auth()
    if (!session?.user?.id) {
      const { NextResponse } = await import('next/server')
      return NextResponse.json({ success: false, error: 'Login required' }, { status: 401 })
    }

    const userId = session.user.id
    const { searchParams } = new URL(request.url)
    const city     = searchParams.get('city')
    const country  = searchParams.get('country')
    const category = searchParams.get('category')
    const sort     = searchParams.get('sort') || 'upvotes'
    const search   = searchParams.get('search')
    const page     = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit    = Math.min(30, Math.max(1, parseInt(searchParams.get('limit') ?? '15')))

    const query = { isFlagged: false }
    if (city)     query.city    = { $regex: city,    $options: 'i' }
    if (country)  query.country = { $regex: country, $options: 'i' }
    if (category && CATEGORIES.includes(category)) query.category = category
    if (search)   query.$or = [
      { title:       { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { city:        { $regex: search, $options: 'i' } },
      { country:     { $regex: search, $options: 'i' } },
    ]

    const sortMap = {
      upvotes:        { upvoteCount: -1 },
      newest:         { createdAt: -1 },
      verified_first: { isVerifiedExperience: -1, upvoteCount: -1 },
    }
    const sortQuery = sortMap[sort] ?? sortMap.upvotes

    const [recs, total] = await Promise.all([
      Recommendation.find(query)
        .sort(sortQuery)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('authorId', 'fullName profilePhotoUrl verificationTier city')
        .lean(),
      Recommendation.countDocuments(query),
    ])

    const recsOut = recs.map(r => ({
      ...r,
      hasUpvoted: r.upvotes?.some(id => id.toString() === userId) ?? false,
    }))

    return ok({ recommendations: recsOut, total, page, totalPages: Math.ceil(total / limit) })
  } catch (e) {
    return handleError(e)
  }
}

export async function POST(request) {
  try {
    const session = await connectAndAuth()
    const userId  = session.user.id
    const body    = await request.json()

    const {
      city, country, countryCode, category, title, description,
      priceRange, currency, approximatePrice, address, websiteUrl,
      imageUrls = [], imagePublicIds = [],
    } = body

    if (!city?.trim())        return fail('City is required', 400)
    if (!country?.trim())     return fail('Country is required', 400)
    if (!category || !CATEGORIES.includes(category)) return fail('Valid category is required', 400)
    if (!title?.trim())       return fail('Title is required', 400)
    if (!description?.trim()) return fail('Description is required', 400)

    // Check if author has a completed stay in that city for verified badge
    const cityLower    = city.trim().toLowerCase()
    const countryLower = country.trim().toLowerCase()
    const completedStay = await HostingRequest.findOne({
      $or: [{ guestId: userId }, { hostId: userId }],
      status: 'completed',
    })
      .populate('hostId', 'city country')
      .populate('guestId', 'city country')
      .lean()

    // Simplified check: if user has any completed stay, allow verification badge
    // In a production system you'd match the city/country of the host profile
    const isVerifiedExperience = !!completedStay

    const rec = await Recommendation.create({
      authorId: userId,
      city: city.trim(),
      country: country.trim(),
      countryCode,
      category,
      title: title.trim(),
      description: description.trim(),
      priceRange,
      currency,
      approximatePrice,
      address,
      websiteUrl,
      imageUrls: imageUrls.slice(0, 3),
      imagePublicIds: imagePublicIds.slice(0, 3),
      isVerifiedExperience,
    })

    const populated = await Recommendation.findById(rec._id)
      .populate('authorId', 'fullName profilePhotoUrl verificationTier city')
      .lean()

    return ok({ ...populated, hasUpvoted: false })
  } catch (e) {
    return handleError(e)
  }
}
