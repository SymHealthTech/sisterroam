import User from '@/models/User'
import { ok, connectAndAuth, handleError } from '@/lib/apiHelpers'

// How many of the most-recently-joined sisters see the welcome post.
const NEWEST_WINDOW = 5

// GET /api/users/welcome-status
// Tells the /feed community stream whether the signed-in sister is a newcomer
// who should be shown the one-time welcome post. A sister qualifies while she
// is among the NEWEST_WINDOW most recently joined active members — so the last
// five existing sisters see it now, and every brand-new signup sees it the
// moment she lands on /feed (dropping off naturally as newer sisters join).
export async function GET() {
  try {
    const session = await connectAndAuth()

    const me = await User.findById(session.user.id)
      .select(
        'fullName city country bio travellerCategories hobbies countriesVisited verificationTier profilePhotoUrl createdAt',
      )
      .lean()

    if (!me) return ok({ isNewcomer: false })

    // Count active sisters who joined strictly after me. Fewer than the window
    // size means I'm still inside the newest-N group.
    const joinedAfter = await User.countDocuments({
      isActive: true,
      isSuspended: { $ne: true },
      isPermanentlyBanned: { $ne: true },
      createdAt: { $gt: me.createdAt },
    })

    return ok({
      isNewcomer: joinedAfter < NEWEST_WINDOW,
      joinedAfter,
      profile: {
        fullName: me.fullName,
        city: me.city ?? null,
        country: me.country ?? null,
        bio: me.bio ?? null,
        travellerCategories: me.travellerCategories ?? [],
        hobbies: me.hobbies ?? [],
        countriesVisited: me.countriesVisited ?? [],
        verificationTier: me.verificationTier ?? 'basic',
        profilePhotoUrl: me.profilePhotoUrl ?? null,
      },
    })
  } catch (e) {
    return handleError(e)
  }
}
