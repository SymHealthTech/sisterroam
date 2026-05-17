import mongoose from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import Review from '@/models/Review'
import HostingRequest from '@/models/HostingRequest'
import User from '@/models/User'
import Notification from '@/models/Notification'
import { ok, fail, getSession, handleError } from '@/lib/apiHelpers'

export async function GET(request) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const revieweeId = searchParams.get('revieweeId')
    const page  = Math.max(1, parseInt(searchParams.get('page')  ?? '1'))
    const limit = Math.min(20, Math.max(1, parseInt(searchParams.get('limit') ?? '5')))

    if (!revieweeId || !/^[a-f\d]{24}$/i.test(revieweeId)) {
      return fail('Valid revieweeId is required', 400)
    }

    const filter = { revieweeId: new mongoose.Types.ObjectId(revieweeId), isPublished: true }
    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .sort({ publishedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('reviewerId', 'fullName username profilePhotoUrl verificationTier')
        .lean(),
      Review.countDocuments(filter),
    ])
    return ok(
      { reviews, total, page, totalPages: Math.ceil(total / limit) },
      { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' }
    )
  } catch (e) {
    return handleError(e)
  }
}

async function recalcRating(userId) {
  const uid = typeof userId === 'string'
    ? new mongoose.Types.ObjectId(userId)
    : userId
  const [agg] = await Review.aggregate([
    { $match: { revieweeId: uid, isPublished: true } },
    { $group: { _id: null, avg: { $avg: '$overallRating' }, count: { $sum: 1 } } },
  ])
  await User.findByIdAndUpdate(uid, {
    averageRating: agg ? Math.round(agg.avg * 10) / 10 : 0,
    totalReviews:  agg?.count ?? 0,
  })
}

export async function POST(request) {
  try {
    await connectDB()
    const session = await getSession()
    const body = await request.json()

    const {
      requestId, overallRating, safetyRating, cleanlinessRating,
      communicationRating, accuracyRating, wouldRecommend, content,
    } = body

    if (!requestId || !overallRating || !wouldRecommend || !content) {
      return fail('requestId, overallRating, wouldRecommend, and content are required', 400)
    }

    const req = await HostingRequest.findById(requestId)
    if (!req) return fail('Request not found', 404)
    if (req.status !== 'completed') return fail('Can only review completed stays', 400)

    const isGuest = req.guestId.toString() === session.user.id
    const isHost  = req.hostId.toString()  === session.user.id
    if (!isGuest && !isHost) return fail('Access denied', 403)

    const existing = await Review.findOne({ requestId, reviewerId: session.user.id })
    if (existing) return fail('You have already submitted a review for this stay', 409)

    const revieweeId = isGuest ? req.hostId : req.guestId

    const review = await Review.create({
      reviewerId:   session.user.id,
      revieweeId,
      requestId,
      overallRating,
      safetyRating,
      cleanlinessRating,
      communicationRating,
      accuracyRating,
      wouldRecommend,
      content,
      reviewerSubmittedAt: new Date(),
    })

    // Publish both reviews when the other party has also submitted
    const otherReview = await Review.findOne({ requestId, reviewerId: revieweeId })
    if (otherReview) {
      await Review.updateMany(
        { _id: { $in: [review._id, otherReview._id] } },
        { $set: { isPublished: true, publishedAt: new Date() } }
      )

      await Promise.all([
        recalcRating(revieweeId),
        recalcRating(session.user.id),
      ])

      await Notification.create([
        {
          recipientId: revieweeId,
          type:        'review_received',
          title:       'New review',
          body:        `${session.user.fullName} left you a review`,
          link:        '/profile',
        },
        {
          recipientId: session.user.id,
          type:        'review_received',
          title:       'Review published',
          body:        'Both reviews are now live on your profile',
          link:        '/profile',
        },
      ])
    }

    return ok(review.toObject())
  } catch (e) {
    return handleError(e)
  }
}
