import User from '@/models/User'
import CommunityPost from '@/models/CommunityPost'
import { ok, connectAndAuth, handleError } from '@/lib/apiHelpers'

// The welcome post auto-retires this long after signup...
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000
// ...or as soon as she has published her first community post — whichever first.

// One-time bootstrap: sisters who joined on or before this cutoff (the founding
// members who existed before the welcome post launched) also see it — with no
// 7-day expiry, since their accounts are already older — until they dismiss it
// or make their first post. Sisters who join AFTER the cutoff use the normal
// 7-day rule. Set to just after launch so all current members are included.
const BOOTSTRAP_BEFORE = new Date('2026-07-16T00:00:00Z')

// GET /api/users/welcome-status
// Tells the /feed community stream whether the signed-in sister should see the
// personal welcome post. It's private to her — no one else sees it. She sees it
// while she hasn't posted yet AND (she's within her first 7 days OR she's a
// founding member from before the bootstrap cutoff). Retires on her first post,
// at 7 days (new sisters), or when she dismisses it (client-side localStorage).
export async function GET() {
  try {
    const session = await connectAndAuth()

    const me = await User.findById(session.user.id).select('fullName city country bio travellerCategories hobbies countriesVisited verificationTier profilePhotoUrl createdAt').lean()

    if (!me) return ok({ isNewcomer: false })

    const createdAt = new Date(me.createdAt)
    const withinAge = Date.now() - createdAt.getTime() < MAX_AGE_MS
    const isFoundingMember = createdAt <= BOOTSTRAP_BEFORE
    const hasPosted = !!(await CommunityPost.exists({ authorId: session.user.id }))

    const isNewcomer = !hasPosted && (withinAge || isFoundingMember)

    return ok({
      isNewcomer,
      hasPosted,
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
