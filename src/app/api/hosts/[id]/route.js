import mongoose from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import HostProfile from '@/models/HostProfile'
import Review from '@/models/Review'
import { auth } from '@/lib/auth'
import { ok, fail, handleError } from '@/lib/apiHelpers'

const USER_PUBLIC = 'fullName username age city country profilePhotoUrl languages bio travellerCategories countriesVisited hobbies instagramUrl linkedinUrl verificationTier role createdAt totalStays averageRating totalReviews'

const UPDATABLE = [
  'accommodationType', 'maxGuests', 'freeOfferings', 'houseRules',
  'languagesForGuests', 'femaleOnly', 'isAcceptingGuests', 'isListingActive',
  'paidServices', 'addressLine', 'addressCity', 'addressCountry',
]

export async function GET(request, { params }) {
  try {
    await connectDB()
    const { id } = await params

    const isOid = /^[a-f\d]{24}$/i.test(id)
    const filter = isOid
      ? { $or: [{ _id: new mongoose.Types.ObjectId(id) }, { userId: new mongoose.Types.ObjectId(id) }] }
      : null

    if (!filter) return fail('Invalid ID', 400)

    const profile = await HostProfile.findOne(filter)
      .populate('userId', USER_PUBLIC)
      .lean()

    if (!profile) return fail('Host not found', 404)

    const reviews = await Review.find({ revieweeId: profile.userId._id, isPublished: true })
      .sort({ publishedAt: -1 })
      .limit(5)
      .populate('reviewerId', 'fullName username profilePhotoUrl')
      .lean()

    const res = ok({ ...profile, reviews })
    res.headers.set('Cache-Control', 's-maxage=30, stale-while-revalidate=300')
    return res
  } catch (e) {
    return handleError(e)
  }
}

export async function PATCH(request, { params }) {
  try {
    await connectDB()
    const session = await auth()
    if (!session?.user?.id) return fail('Not authenticated', 401)

    const { id } = await params
    const body = await request.json()

    const profile = await HostProfile.findById(id)
    if (!profile) return fail('Host profile not found', 404)
    if (profile.userId.toString() !== session.user.id) return fail('Access denied', 403)

    for (const key of UPDATABLE) {
      if (body[key] !== undefined) profile[key] = body[key]
    }

    await profile.save()
    return ok(profile.toObject())
  } catch (e) {
    return handleError(e)
  }
}
