import CoTravelPost from '@/models/CoTravelPost'
import CoTravelInterest from '@/models/CoTravelInterest'
import HostingRequest from '@/models/HostingRequest'
import Notification from '@/models/Notification'
import User from '@/models/User'
import { ok, fail, connectAndAuth, handleError } from '@/lib/apiHelpers'
import { sendToUser } from '@/lib/sse'
import {
  sendCoTravellerInterestEmail,
  sendCoTravellerAcceptedEmail,
  sendCoTravellerDeclinedEmail,
} from '@/lib/resend'

export async function GET(request, { params }) {
  try {
    const session = await connectAndAuth()
    const { postId } = await params
    const userId = session.user.id

    const post = await CoTravelPost.findById(postId).lean()
    if (!post) return fail('Post not found', 404)
    if (post.authorId.toString() !== userId) return fail('Not authorised', 403)

    const interests = await CoTravelInterest.find({ postId })
      .populate(
        'interestedUserId',
        'fullName profilePhotoUrl verificationTier city country languages bio totalStays averageRating travellerCategories'
      )
      .lean()

    // Sort: verified first, then by createdAt
    interests.sort((a, b) => {
      const tierOrder = { trusted: 0, verified: 1, basic: 2 }
      const aT = tierOrder[a.interestedUserId?.verificationTier] ?? 2
      const bT = tierOrder[b.interestedUserId?.verificationTier] ?? 2
      if (aT !== bT) return aT - bT
      return new Date(a.createdAt) - new Date(b.createdAt)
    })

    return ok(interests)
  } catch (e) {
    return handleError(e)
  }
}

export async function POST(request, { params }) {
  try {
    const session = await connectAndAuth()
    const { postId } = await params
    const userId = session.user.id
    const body = await request.json()
    const { message } = body

    const post = await CoTravelPost.findById(postId)
      .populate('authorId', 'fullName email verificationTier')
      .lean()
    if (!post) return fail('Post not found', 404)

    if (post.authorId._id.toString() === userId) {
      return fail('You cannot express interest in your own trip', 400)
    }
    if (post.status !== 'open') return fail('This trip is no longer accepting co-travellers', 400)
    if (new Date(post.departureDate) < new Date()) {
      return fail('This trip has already departed', 400)
    }

    if (post.lookingFor?.verifiedOnly) {
      const currentUser = await User.findById(userId, 'verificationTier').lean()
      if (currentUser?.verificationTier === 'basic') {
        return fail(
          'This trip requires verified members. Complete your verification to apply.',
          403
        )
      }
    }

    if (!message?.trim()) return fail('A message is required', 400)
    if (message.trim().length < 50) return fail('Message must be at least 50 characters', 400)

    let interest
    try {
      interest = await CoTravelInterest.create({
        postId,
        interestedUserId: userId,
        message: message.trim(),
      })
    } catch (err) {
      if (err.code === 11000) return fail('You have already expressed interest in this trip', 400)
      throw err
    }

    await CoTravelPost.findByIdAndUpdate(postId, { $inc: { interestedCount: 1 } })

    const interestedUser = await User.findById(userId, 'fullName profilePhotoUrl').lean()
    const authorId = post.authorId._id.toString()

    await Notification.create({
      recipientId: authorId,
      type: 'new_cotraveller_interest',
      title: `${interestedUser.fullName} wants to join your trip to ${post.toCity}!`,
      body: message.trim().slice(0, 100),
      link: `/cotraveller/${postId}/interests`,
    })

    sendToUser(authorId, 'new_cotraveller_interest', {
      postId,
      toCity: post.toCity,
      interestedUser: {
        id: userId,
        fullName: interestedUser.fullName,
        profilePhotoUrl: interestedUser.profilePhotoUrl,
      },
      messagePreview: message.trim().slice(0, 100),
    })

    try {
      await sendCoTravellerInterestEmail(post.authorId, interestedUser, post)
    } catch {}

    return ok(interest)
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
    const { interestId, action } = body

    if (!interestId || !['accept', 'decline'].includes(action)) {
      return fail('interestId and action (accept|decline) are required', 400)
    }

    const post = await CoTravelPost.findById(postId).lean()
    if (!post) return fail('Post not found', 404)
    if (post.authorId.toString() !== userId) return fail('Not authorised', 403)

    const interest = await CoTravelInterest.findById(interestId)
      .populate('interestedUserId', 'fullName email profilePhotoUrl')
      .lean()
    if (!interest) return fail('Interest not found', 404)
    if (interest.postId.toString() !== postId) return fail('Interest does not belong to this post', 400)

    const authorUser = await User.findById(userId, 'fullName email').lean()

    if (action === 'accept') {
      if (post.currentCoTravellers >= post.maxCoTravellers) {
        return fail('You have already filled all spots', 400)
      }

      const chatRequest = await HostingRequest.create({
        guestId: interest.interestedUserId._id,
        hostId: userId,
        checkInDate: post.departureDate,
        checkOutDate: post.returnDate || post.departureDate,
        message: `Co-traveller match for trip to ${post.toCity}`,
        status: 'accepted',
        requestType: 'cotraveller',
        safetyAcknowledged: true,
      })

      const updatedInterest = await CoTravelInterest.findByIdAndUpdate(
        interestId,
        { status: 'accepted', acceptedAt: new Date(), chatRequestId: chatRequest._id },
        { new: true }
      )

      const newCount = post.currentCoTravellers + 1
      const newStatus = newCount >= post.maxCoTravellers ? 'filled' : 'open'
      await CoTravelPost.findByIdAndUpdate(postId, {
        $inc: { currentCoTravellers: 1 },
        status: newStatus,
      })

      const intUserId = interest.interestedUserId._id.toString()

      await Notification.create({
        recipientId: intUserId,
        type: 'cotraveller_accepted',
        title: `${authorUser.fullName} accepted your request to join the trip to ${post.toCity}!`,
        body: 'You can now chat to plan your trip together.',
        link: `/messages/${chatRequest._id}`,
      })

      sendToUser(intUserId, 'cotraveller_accepted', {
        postId,
        toCity: post.toCity,
        chatRequestId: chatRequest._id.toString(),
        authorName: authorUser.fullName,
      })

      try {
        await sendCoTravellerAcceptedEmail(interest.interestedUserId, authorUser, post, chatRequest._id)
      } catch {}

      return ok(updatedInterest)
    }

    // action === 'decline'
    const updatedInterest = await CoTravelInterest.findByIdAndUpdate(
      interestId,
      { status: 'declined', declinedAt: new Date() },
      { new: true }
    )

    const intUserId = interest.interestedUserId._id.toString()

    await Notification.create({
      recipientId: intUserId,
      type: 'cotraveller_declined',
      title: `Trip update for ${post.toCity}`,
      body: 'Your request to join was not accepted this time. Keep exploring other trips!',
      link: '/cotraveller',
    })

    sendToUser(intUserId, 'cotraveller_declined', {
      postId,
      toCity: post.toCity,
    })

    try {
      await sendCoTravellerDeclinedEmail(interest.interestedUserId, authorUser, post)
    } catch {}

    return ok(updatedInterest)
  } catch (e) {
    return handleError(e)
  }
}
