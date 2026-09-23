import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import HostProfile from '@/models/HostProfile'
import { ok, fail, connectAndAuth, handleError } from '@/lib/apiHelpers'
import { notifyAdminsOfPendingModeration, checkProfilePhotoChange } from '@/lib/moderation'

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
    // A profile photo is only surfaced once an admin approves it. While it is
    // pending/rejected we withhold the URL so every avatar (sidebar, top bar,
    // profile header, navbar — all read from here) falls back to initials.
    // profilePhotoStatus is still returned so the UI can show the review notice.
    if (user.profilePhotoStatus && user.profilePhotoStatus !== 'approved') {
      user.profilePhotoUrl = null
      user.profilePhotoPublicId = null
    }
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
    // Settings → "Deactivate account". Signing in again reactivates (lib/auth.js).
    if (body.isActive === false) $set.isActive = false

    // A newly uploaded profile photo is public + manually moderated: mark it
    // 'pending' so the UI shows initials until an admin approves it. Cloudinary
    // won't deliver the image until then either.
    if (body.profilePhotoPublicId !== undefined && body.profilePhotoPublicId) {
      $set.profilePhotoStatus = 'pending'
    }
    // A bare URL change must also be our own moderated upload (never an
    // arbitrary link) and goes back to review.
    if ($set.profilePhotoUrl) {
      const current = await User.findById(session.user.id).select('profilePhotoUrl').lean()
      const photo = checkProfilePhotoChange(current?.profilePhotoUrl, $set.profilePhotoUrl)
      if (photo.error) return fail(photo.error, 400)
      Object.assign($set, photo.$set)
    }

    const user = await User.findByIdAndUpdate(
      session.user.id,
      { $set },
      { new: true, runValidators: true }
    ).lean()

    if (!user) return fail('User not found', 404)

    // A newly uploaded profile photo is held for moderation — alert admins.
    if ($set.profilePhotoStatus === 'pending') {
      notifyAdminsOfPendingModeration({
        kind:   'profile_photo',
        detail: user.fullName ? `from ${user.fullName}` : '',
      }).catch(() => {})
    }

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
