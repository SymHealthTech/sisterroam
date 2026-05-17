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

// Cache admin stats for 60s — these 9 countDocuments are expensive and the
// data doesn't need to be real-time on the dashboard.
let _statsCache = null
let _statsCacheAt = 0
const STATS_TTL = 60_000

export async function GET() {
  try {
    const session = await connectAndAuth()
    if (!session.user.isAdmin) return fail('Admin access required', 403)

    if (_statsCache && Date.now() - _statsCacheAt < STATS_TTL) {
      return ok(_statsCache)
    }

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

    _statsCache = {
      totalMembers,
      verifiedMembers,
      pendingKyc,
      activeStays,
      openReports,
      blogPosts,
      openCoTravelPosts,
      totalRecommendations,
      openQuestions,
    }
    _statsCacheAt = Date.now()

    return ok(_statsCache)
  } catch (e) {
    return handleError(e)
  }
}
