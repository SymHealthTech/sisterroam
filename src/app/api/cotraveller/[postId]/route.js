import CoTravelPost from '@/models/CoTravelPost'
import CoTravelInterest from '@/models/CoTravelInterest'
import Notification from '@/models/Notification'
import { ok, fail, connectAndAuth, handleError } from '@/lib/apiHelpers'
import { connectDB } from '@/lib/mongodb'
import { auth } from '@/lib/auth'

export async function GET(request, { params }) {
  try {
    await connectDB()
    const session = await auth()
    if (!session?.user?.id) return fail('Login required', 401)

    const { postId } = await params
    const userId = session.user.id

    const post = await CoTravelPost.findById(postId)
      .populate('authorId', 'fullName profilePhotoUrl verificationTier city country languages bio travellerCategories totalStays averageRating createdAt')
      .lean()

    if (!post) return fail('Post not found', 404)

    await CoTravelPost.findByIdAndUpdate(postId, { $inc: { viewsCount: 1 } })

    const userInterest = await CoTravelInterest.findOne({
      postId,
      interestedUserId: userId,
    }).lean()

    return ok({
      post,
      authorProfile: post.authorId,
      hasExpressedInterest: !!userInterest,
      userInterestStatus: userInterest?.status ?? null,
      userInterestId: userInterest?._id ?? null,
      chatRequestId: userInterest?.chatRequestId ?? null,
    })
  } catch (e) {
    return handleError(e)
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await connectAndAuth()
    const { postId } = await params
    const userId = session.user.id
    const body = await request.json()

    const post = await CoTravelPost.findById(postId)
    if (!post) return fail('Post not found', 404)
    if (post.authorId.toString() !== userId) return fail('Not authorised', 403)

    const allowed = ['title', 'description', 'departureDate', 'isFlexibleDates', 'status']
    for (const key of allowed) {
      if (body[key] !== undefined) post[key] = body[key]
    }

    if (body.status === 'filled') {
      const pendingInterests = await CoTravelInterest.find({
        postId,
        status: 'pending',
      }).populate('interestedUserId', 'fullName').lean()

      for (const interest of pendingInterests) {
        await Notification.create({
          recipientId: interest.interestedUserId._id,
          type: 'cotraveller_filled',
          title: `Trip to ${post.toCity} is now filled`,
          body: 'All spots for this trip have been filled. Keep exploring other trips!',
          link: '/cotraveller',
        })
      }
    }

    await post.save()
    return ok(post)
  } catch (e) {
    return handleError(e)
  }
}
