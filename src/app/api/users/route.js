import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import HostProfile from '@/models/HostProfile'
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

    // Keep the host listing in sync with the role, so /explore and host profile
    // views reflect the change immediately. A Traveller (guest) is de-listed; a
    // Host / Host & Traveller is re-listed (no-op if she has no host profile yet).
    if (body.role !== undefined) {
      const isListingActive = body.role === 'host' || body.role === 'both'
      await HostProfile.updateOne(
        { userId: session.user.id },
        { $set: { isListingActive } }
      )
    }

    delete user.password
    return ok(user)
  } catch (e) {
    return handleError(e)
  }
}
