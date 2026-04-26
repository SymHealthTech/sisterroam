import User from '@/models/User'
import HostProfile from '@/models/HostProfile'
import VerificationRequest from '@/models/VerificationRequest'
import HostingRequest from '@/models/HostingRequest'
import SafetyReport from '@/models/SafetyReport'
import TravelStory from '@/models/TravelStory'
import CoTravelPost from '@/models/CoTravelPost'
import Recommendation from '@/models/Recommendation'
import RecommendationQuestion from '@/models/RecommendationQuestion'
import { ok, fail, connectAndAuth, handleError } from '@/lib/apiHelpers'

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
    })
  } catch (e) {
    return handleError(e)
  }
}
