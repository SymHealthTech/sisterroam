import User from '@/models/User'
import HostProfile from '@/models/HostProfile'
import VerificationRequest from '@/models/VerificationRequest'
import HostingRequest from '@/models/HostingRequest'
import SafetyReport from '@/models/SafetyReport'
import TravelStory from '@/models/TravelStory'
import CommunityPost from '@/models/CommunityPost'
import CoTravelPost from '@/models/CoTravelPost'
import Recommendation from '@/models/Recommendation'
import RecommendationQuestion from '@/models/RecommendationQuestion'
import { ok, fail, connectAndAuth, handleError } from '@/lib/apiHelpers'

// Not cached: the dashboard is admin-only + low-traffic, and a stale count (e.g.
// KYC/moderation pending not dropping right after an approve/reject) is worse
// than a few extra countDocuments. Numbers are always read fresh.
export async function GET() {
  try {
    const session = await connectAndAuth()
    if (!session.user.isAdmin) return fail('Admin access required', 403)

    const [
      totalMembers,
      verifiedMembers,
      pendingKyc,
      activeStays,
      openReports,
      blogPosts,
      openCoTravelPosts,
      totalRecommendations,
      openQuestions,
      pendingPhotos,
      pendingPosts,
      pendingStories,
    ] = await Promise.all([
      User.countDocuments({ isActive: { $ne: false } }),
      User.countDocuments({ verificationTier: { $in: ['verified', 'trusted'] } }),
      VerificationRequest.countDocuments({ status: 'pending' }),
      HostingRequest.countDocuments({ status: 'accepted' }),
      SafetyReport.countDocuments({ status: 'open' }),
      TravelStory.countDocuments({ isPublished: true }),
      CoTravelPost.countDocuments({ status: 'open' }),
      Recommendation.countDocuments({ isFlagged: false }),
      RecommendationQuestion.countDocuments({ status: 'open' }),
      User.countDocuments({ profilePhotoStatus: 'pending' }),
      CommunityPost.countDocuments({ moderationStatus: 'pending' }),
      TravelStory.countDocuments({ coverModerationStatus: 'pending' }),
    ])

    return ok({
      totalMembers,
      verifiedMembers,
      pendingKyc,
      activeStays,
      openReports,
      blogPosts,
      openCoTravelPosts,
      totalRecommendations,
      openQuestions,
      // Public images (profile photos + post images + story covers) awaiting review.
      pendingModeration: pendingPhotos + pendingPosts + pendingStories,
    })
  } catch (e) {
    return handleError(e)
  }
}
