import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import { auth } from '@/lib/auth'
import { ok, fail, handleError } from '@/lib/apiHelpers'

const PUBLIC = 'fullName username age city country profilePhotoUrl languages bio travellerCategories countriesVisited hobbies instagramUrl linkedinUrl verificationTier role createdAt totalStays averageRating totalReviews'

const ONBOARDING_FIELDS = [
  'role', 'onboardingCompleted', 'onboardingStep',
  'fullName', 'age', 'gender', 'city', 'country', 'languages', 'education',
  'occupation', 'bio', 'travellerCategories', 'countriesVisited', 'hobbies',
  'instagramUrl', 'linkedinUrl', 'facebookUrl', 'profilePhotoUrl', 'profilePhotoPublicId',
]

export async function GET(request, { params }) {
  try {
    await connectDB()
    const { id } = await params

    let user = null
    // Try by ObjectId, fall back to username
    if (/^[a-f\d]{24}$/i.test(id)) {
      user = await User.findById(id).select(PUBLIC).lean()
    }
    if (!user) {
      user = await User.findOne({ username: id }).select(PUBLIC).lean()
    }
    if (!user) return fail('User not found', 404)
    return ok(user)
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
    if (session.user.id !== id) return fail('Access denied', 403)

    const body = await request.json()
    const $set = {}
    for (const field of ONBOARDING_FIELDS) {
      if (body[field] !== undefined) $set[field] = body[field]
    }

    const user = await User.findByIdAndUpdate(id, { $set }, { new: true, runValidators: true }).lean()
    if (!user) return fail('User not found', 404)
    delete user.password
    return ok(user)
  } catch (e) {
    return handleError(e)
  }
}
