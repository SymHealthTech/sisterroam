import VerificationRequest from '@/models/VerificationRequest'
import SafetyReport from '@/models/SafetyReport'
import User from '@/models/User'
import CommunityPost from '@/models/CommunityPost'
import TravelStory from '@/models/TravelStory'
import { ok, fail, connectAndAuth, handleError } from '@/lib/apiHelpers'

// Not cached: these badge counts must drop immediately after an admin approves
// or rejects an item (a lingering "KYC pending" number is confusing). The admin
// nav fetches this once per page mount — the extra countDocuments are cheap.
export async function GET() {
  try {
    const session = await connectAndAuth()
    if (!session.user.isAdmin) return fail('Admin access required', 403)

    const [pendingKyc, openReports, pendingPhotos, pendingPosts, pendingStories] = await Promise.all([
      VerificationRequest.countDocuments({ status: 'pending' }),
      SafetyReport.countDocuments({ status: 'open' }),
      User.countDocuments({ profilePhotoStatus: 'pending' }),
      CommunityPost.countDocuments({ moderationStatus: 'pending' }),
      TravelStory.countDocuments({ coverModerationStatus: 'pending' }),
    ])

    const pendingModeration = pendingPhotos + pendingPosts + pendingStories
    return ok({ pendingKyc, openReports, pendingModeration })
  } catch (e) {
    return handleError(e)
  }
}
