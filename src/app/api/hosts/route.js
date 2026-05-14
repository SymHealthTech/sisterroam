import { connectDB } from '@/lib/mongodb'
import HostProfile from '@/models/HostProfile'
import { auth } from '@/lib/auth'
import { ok, fail, handleError, requireVerified } from '@/lib/apiHelpers'

const HOST_PROJECT = {
  accommodationType: 1, maxGuests: 1, freeOfferings: 1, femaleOnly: 1,
  totalStays: 1, responseRate: 1, houseRules: 1, paidServices: 1,
  addressCity: 1, addressCountry: 1, createdAt: 1,
  'user._id': 1, 'user.fullName': 1, 'user.username': 1,
  'user.profilePhotoUrl': 1, 'user.city': 1, 'user.country': 1,
  'user.languages': 1, 'user.bio': 1, 'user.travellerCategories': 1,
  'user.verificationTier': 1, 'user.averageRating': 1, 'user.totalReviews': 1,
  'user.createdAt': 1,
}

export async function GET(request) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)

    const q                = searchParams.get('q')?.trim() ?? ''
    const country          = searchParams.get('country')
    const city             = searchParams.get('city')
    const femaleOnly       = searchParams.get('femaleOnly') === 'true'
    const category         = searchParams.get('category')
    const accommodationType = searchParams.get('accommodationType')
    const verifiedOnly     = searchParams.get('verifiedOnly') === 'true'
    const page             = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit            = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '12')))
    const sort             = searchParams.get('sort') ?? 'stays'

    const sortStage = sort === 'rating'
      ? { 'user.averageRating': -1 }
      : sort === 'newest'
      ? { 'user.createdAt': -1 }
      : { totalStays: -1 }

    const baseMatch = { isListingActive: true, isAcceptingGuests: true }
    if (femaleOnly) baseMatch.femaleOnly = true
    if (accommodationType) baseMatch.accommodationType = accommodationType

    const userMatch = { 'user.isActive': true, 'user.isPermanentlyBanned': { $ne: true } }
    if (country) userMatch['user.country'] = { $regex: country, $options: 'i' }
    if (city)    userMatch['user.city']    = { $regex: city,    $options: 'i' }
    if (category)    userMatch['user.travellerCategories'] = category
    if (verifiedOnly) userMatch['user.verificationTier']  = { $in: ['verified', 'trusted'] }
    if (q) {
      const nameOr = [
        { 'user.fullName': { $regex: q, $options: 'i' } },
        { 'user.username': { $regex: q, $options: 'i' } },
      ]
      // Initials search: "JS" → matches names where each letter starts a word, e.g. "John Smith"
      if (/^[a-z]{2,5}$/i.test(q)) {
        const initialsPattern = q.split('').map(c => `\\b${c}`).join('.*')
        nameOr.push({ 'user.fullName': { $regex: initialsPattern, $options: 'i' } })
      }
      userMatch.$or = nameOr
    }

    const basePipeline = [
      { $match: baseMatch },
      { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $match: userMatch },
    ]

    const [countResult, hosts] = await Promise.all([
      HostProfile.aggregate([...basePipeline, { $count: 'total' }]),
      HostProfile.aggregate([
        ...basePipeline,
        { $sort: sortStage },
        { $skip: (page - 1) * limit },
        { $limit: limit },
        { $project: HOST_PROJECT },
      ]),
    ])

    const total = countResult[0]?.total ?? 0
    const res = ok({ hosts, total, page, totalPages: Math.ceil(total / limit) })
    res.headers.set('Cache-Control', 's-maxage=30, stale-while-revalidate=120')
    return res
  } catch (e) {
    return handleError(e)
  }
}

export async function POST(request) {
  try {
    await connectDB()
    const session = await auth()
    if (!session?.user?.id) return fail('Not authenticated', 401)
    if (session.user.verificationTier === 'basic') return fail('Verification required to become a host', 403)

    const body = await request.json()
    if (!body.accommodationType) return fail('accommodationType is required', 400)

    const existing = await HostProfile.findOne({ userId: session.user.id })
    if (existing) return fail('Host profile already exists', 409)

    // Auto-promote guest to 'both' so they can host and travel
    const User = (await import('@/models/User')).default
    const dbUser = await User.findById(session.user.id).select('role').lean()
    if (dbUser?.role === 'guest') {
      await User.findByIdAndUpdate(session.user.id, { role: 'both' })
    }

    const profile = await HostProfile.create({ userId: session.user.id, ...body })
    return ok(profile.toObject())
  } catch (e) {
    return handleError(e)
  }
}
