import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import { auth } from '@/lib/auth'
import { ok, fail, handleError } from '@/lib/apiHelpers'
import { checkProfilePhotoChange } from '@/lib/moderation'

const PUBLIC = 'fullName username age city country profilePhotoUrl languages bio travellerCategories countriesVisited hobbies instagramUrl linkedinUrl verificationTier role createdAt totalStays averageRating totalReviews'

const ONBOARDING_FIELDS = [
  'role', 'onboardingCompleted', 'onboardingStep',
  'fullName', 'age', 'gender', 'city', 'country', 'languages', 'education',
  'occupation', 'bio', 'travellerCategories', 'countriesVisited', 'hobbies',
  'instagramUrl', 'linkedinUrl', 'facebookUrl', 'profilePhotoUrl', 'profilePhotoPublicId',
  'emergencyContactName', 'emergencyContactPhone', 'emergencyContactRelationship', 'emergencyContactEmail',
]

export async function GET(request, { params }) {
  try {
    await connectDB()
    // Member profiles (age, city, socials) are for signed-in members only —
    // never for anonymous scrapers.
    const session = await auth()
    if (!session?.user?.id) return fail('Not authenticated', 401)
    const { id } = await params

    // Single query: match by _id (if valid ObjectId) or username
    const filter = /^[a-f\d]{24}$/i.test(id)
      ? { $or: [{ _id: id }, { username: id }] }
      : { username: id }
    const user = await User.findOne(filter).select(PUBLIC).lean()
    if (!user) return fail('User not found', 404)
    // Private: must not be stored by a shared/CDN cache now that it needs a login.
    return ok(user, { 'Cache-Control': 'private, no-store' })
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

    // A changed photo URL must be our own moderated upload and goes back to review.
    if ($set.profilePhotoUrl) {
      const current = await User.findById(id).select('profilePhotoUrl').lean()
      const photo = checkProfilePhotoChange(current?.profilePhotoUrl, $set.profilePhotoUrl)
      if (photo.error) return fail(photo.error, 400)
      Object.assign($set, photo.$set)
    }

    const user = await User.findByIdAndUpdate(id, { $set }, { new: true, runValidators: true }).lean()
    if (!user) return fail('User not found', 404)
    delete user.password
    return ok(user)
  } catch (e) {
    return handleError(e)
  }
}
