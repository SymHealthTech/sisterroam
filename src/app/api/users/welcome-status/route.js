import User from '@/models/User'
import CommunityPost from '@/models/CommunityPost'
import { ok, connectAndAuth, handleError } from '@/lib/apiHelpers'

// The welcome post auto-retires this long after signup...
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000
// ...or as soon as she has published her first community post — whichever first.

// GET /api/users/welcome-status
// Tells the /feed community stream whether the signed-in sister should see the
// personal welcome post. Every newly signed-up sister sees it (it's private to
// her — no one else sees it) until it auto-retires:
//   • her account reaches MAX_AGE_MS old, or
//   • she publishes her first community post.
// She can also dismiss it herself (handled client-side via localStorage).
export async function GET() {
  try {
    const session = await connectAndAuth()

    const me = await User.findById(session.user.id).select('fullName city country bio travellerCategories hobbies countriesVisited verificationTier profilePhotoUrl createdAt').lean()

    if (!me) return ok({ isNewcomer: false })

    const withinAge =
      Date.now() - new Date(me.createdAt).getTime() < MAX_AGE_MS
    const hasPosted = !!(await CommunityPost.exists({ authorId: session.user.id }))

    return ok({
      isNewcomer: withinAge && !hasPosted,
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
