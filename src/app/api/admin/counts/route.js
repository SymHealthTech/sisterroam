import VerificationRequest from '@/models/VerificationRequest'
import SafetyReport from '@/models/SafetyReport'
import User from '@/models/User'
import CommunityPost from '@/models/CommunityPost'
import TravelStory from '@/models/TravelStory'
import { ok, fail, connectAndAuth, handleError } from '@/lib/apiHelpers'

// Cache badge counts for 30s — polled by the admin nav and doesn't need
// to be real-time.
let _countsCache = null
let _countsCacheAt = 0
const COUNTS_TTL = 30_000

export async function GET() {
  try {
    const session = await connectAndAuth()
    if (!session.user.isAdmin) return fail('Admin access required', 403)

    if (_countsCache && Date.now() - _countsCacheAt < COUNTS_TTL) {
      return ok(_countsCache)
    }

    const [pendingKyc, openReports, pendingPhotos, pendingPosts, pendingStories] = await Promise.all([
      VerificationRequest.countDocuments({ status: 'pending' }),
      SafetyReport.countDocuments({ status: 'open' }),
      User.countDocuments({ profilePhotoStatus: 'pending' }),
      CommunityPost.countDocuments({ moderationStatus: 'pending' }),
      TravelStory.countDocuments({ coverModerationStatus: 'pending' }),
    ])

    const pendingModeration = pendingPhotos + pendingPosts + pendingStories
    _countsCache = { pendingKyc, openReports, pendingModeration }
    _countsCacheAt = Date.now()

    return ok(_countsCache)
  } catch (e) {
    return handleError(e)
  }
}
