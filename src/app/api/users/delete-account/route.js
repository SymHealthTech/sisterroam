import mongoose from 'mongoose'
import { ok, connectAndAuth, handleError } from '@/lib/apiHelpers'
import { deleteFile } from '@/lib/cloudinary'
import User from '@/models/User'
import HostProfile from '@/models/HostProfile'
import HostingRequest from '@/models/HostingRequest'
import Message from '@/models/Message'
import Review from '@/models/Review'
import SafetyCheckin from '@/models/SafetyCheckin'
import SafetyReport from '@/models/SafetyReport'
import SosAlert from '@/models/SosAlert'
import Notification from '@/models/Notification'
import TravelStory from '@/models/TravelStory'
import CommunityPost from '@/models/CommunityPost'
import CommunityComment from '@/models/CommunityComment'
import CoTravelPost from '@/models/CoTravelPost'
import CoTravelInterest from '@/models/CoTravelInterest'
import Recommendation from '@/models/Recommendation'
import RecommendationQuestion from '@/models/RecommendationQuestion'
import RecommendationAnswer from '@/models/RecommendationAnswer'
import VerificationRequest from '@/models/VerificationRequest'

export async function DELETE() {
  try {
    const session = await connectAndAuth()
    const uid = new mongoose.Types.ObjectId(session.user.id)

    // --- Hosting requests (guest or host) ---
    const requests = await HostingRequest.find(
      { $or: [{ guestId: uid }, { hostId: uid }] }
    ).select('_id').lean()
    const requestIds = requests.map(r => r._id)

    // Everything tied to those requests
    await Promise.all([
      Message.deleteMany({ $or: [{ requestId: { $in: requestIds } }, { senderId: uid }] }),
      SafetyCheckin.deleteMany({ $or: [{ requestId: { $in: requestIds } }, { userId: uid }] }),
      CoTravelInterest.deleteMany({ chatRequestId: { $in: requestIds } }),
      Review.deleteMany({ $or: [{ reviewerId: uid }, { revieweeId: uid }] }),
    ])
    await HostingRequest.deleteMany({ $or: [{ guestId: uid }, { hostId: uid }] })

    // --- Travel stories ---
    const stories = await TravelStory.find({ authorId: uid }).select('coverImagePublicId').lean()
    await Promise.all(
      stories
        .filter(s => s.coverImagePublicId)
        .map(s => deleteFile(s.coverImagePublicId).catch(() => {}))
    )
    await TravelStory.deleteMany({ authorId: uid })

    // --- Community posts and their comments ---
    const posts = await CommunityPost.find({ authorId: uid }).select('_id imagePublicIds').lean()
    const postIds = posts.map(p => p._id)
    await Promise.all([
      ...posts.flatMap(p => (p.imagePublicIds ?? []).map(id => deleteFile(id).catch(() => {}))),
      CommunityComment.deleteMany({ postId: { $in: postIds } }),
    ])
    await Promise.all([
      CommunityPost.deleteMany({ authorId: uid }),
      CommunityComment.deleteMany({ authorId: uid }),
    ])

    // --- Co-travel posts and interests ---
    await Promise.all([
      CoTravelPost.deleteMany({ authorId: uid }),
      CoTravelInterest.deleteMany({ interestedUserId: uid }),
    ])

    // --- Recommendations ---
    const recs = await Recommendation.find({ authorId: uid }).select('imagePublicIds').lean()
    await Promise.all(
      recs.flatMap(r => (r.imagePublicIds ?? []).map(id => deleteFile(id).catch(() => {})))
    )
    await Recommendation.deleteMany({ authorId: uid })

    // --- Recommendation questions and answers ---
    const questions = await RecommendationQuestion.find({ authorId: uid }).select('_id').lean()
    const questionIds = questions.map(q => q._id)
    await Promise.all([
      RecommendationAnswer.deleteMany({ questionId: { $in: questionIds } }),
      RecommendationAnswer.deleteMany({ authorId: uid }),
      RecommendationQuestion.deleteMany({ authorId: uid }),
    ])

    // --- Notifications, SOS, safety reports filed by this user ---
    await Promise.all([
      Notification.deleteMany({ recipientId: uid }),
      SosAlert.deleteMany({ userId: uid }),
      SafetyReport.deleteMany({ reporterId: uid }),
    ])

    // --- Verification request assets ---
    const verReqs = await VerificationRequest.find({ userId: uid })
      .select('idDocumentPublicId selfieVideoPublicId')
      .lean()
    await Promise.all(
      verReqs.flatMap(v => [
        v.idDocumentPublicId   ? deleteFile(v.idDocumentPublicId).catch(() => {})            : null,
        v.selfieVideoPublicId  ? deleteFile(v.selfieVideoPublicId, 'video').catch(() => {})  : null,
      ].filter(Boolean))
    )
    await VerificationRequest.deleteMany({ userId: uid })

    // --- Host profile ---
    await HostProfile.deleteMany({ userId: uid })

    // --- User profile photo ---
    const user = await User.findById(uid).select('profilePhotoPublicId').lean()
    if (user?.profilePhotoPublicId) {
      await deleteFile(user.profilePhotoPublicId).catch(() => {})
    }

    // --- Finally, delete the user ---
    await User.deleteOne({ _id: uid })

    return ok({ deleted: true })
  } catch (e) {
    return handleError(e)
  }
}
