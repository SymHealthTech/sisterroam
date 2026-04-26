import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import { ok, fail, connectAndAuth, handleError } from '@/lib/apiHelpers'

const UPDATABLE = [
  'fullName', 'age', 'gender', 'city', 'country', 'languages', 'education',
  'occupation', 'bio', 'travellerCategories', 'countriesVisited', 'hobbies',
  'instagramUrl', 'linkedinUrl', 'facebookUrl',
  'emergencyContactName', 'emergencyContactPhone', 'emergencyContactRelationship', 'emergencyContactEmail',
  'role', 'phone', 'profilePhotoUrl', 'profilePhotoPublicId', 'emailNotifications',
]

export async function GET() {
  try {
    const session = await connectAndAuth()
    const user = await User.findById(session.user.id).lean()
    if (!user) return fail('User not found', 404)
    delete user.password
    return ok(user)
  } catch (e) {
    return handleError(e)
  }
}

export async function PATCH(request) {
  try {
    const session = await connectAndAuth()
    const body = await request.json()

    const $set = {}
    for (const field of UPDATABLE) {
      if (body[field] !== undefined) $set[field] = body[field]
    }

    const user = await User.findByIdAndUpdate(
      session.user.id,
      { $set },
      { new: true, runValidators: true }
    ).lean()

    if (!user) return fail('User not found', 404)
    delete user.password
    return ok(user)
  } catch (e) {
    return handleError(e)
  }
}
