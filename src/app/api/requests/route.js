import mongoose from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import HostingRequest from '@/models/HostingRequest'
import HostProfile from '@/models/HostProfile'
import Message from '@/models/Message'
import Notification from '@/models/Notification'
import User from '@/models/User'
import { ok, fail, getSession, handleError } from '@/lib/apiHelpers'
import { sendEmail } from '@/lib/resend'

const USER_PREVIEW = 'fullName username profilePhotoUrl city verificationTier'

export async function GET(request) {
  try {
    await connectDB()
    const session = await getSession()
    const uid = new mongoose.Types.ObjectId(session.user.id)

    const { searchParams } = new URL(request.url)
    const activeToday = searchParams.get('activeToday') === 'true'

    let filter
    if (activeToday) {
      const now = new Date()
      filter = {
        guestId: uid,
        status: 'accepted',
        checkInDate: { $lte: now },
        checkOutDate: { $gte: now },
      }
    } else {
      // Exclude conversations the current user has deleted from her own list.
      filter = { $or: [{ guestId: uid }, { hostId: uid }], deletedBy: { $ne: uid } }
    }

    const requests = await HostingRequest.find(filter)
      .populate('guestId', USER_PREVIEW)
      .populate('hostId',  USER_PREVIEW)
      .sort({ createdAt: -1 })
      .lean()

    // Attach a real unread count per conversation (messages sent *to* me that
    // I haven't read yet). Powers the unread dot/badge in the conversation list.
    const requestIds = requests.map(r => r._id)
    const unreadAgg = requestIds.length
      ? await Message.aggregate([
          { $match: { requestId: { $in: requestIds }, senderId: { $ne: uid }, isRead: false } },
          { $group: { _id: '$requestId', count: { $sum: 1 } } },
        ])
      : []
    const unreadMap = new Map(unreadAgg.map(u => [u._id.toString(), u.count]))
    const withUnread = requests.map(r => ({ ...r, unreadCount: unreadMap.get(r._id.toString()) ?? 0 }))

    return ok(withUnread)
  } catch (e) {
    return handleError(e)
  }
}

export async function POST(request) {
  try {
    await connectDB()
    const session = await getSession()

    if (session.user.verificationTier === 'basic') {
      return fail('Complete verification to send requests', 403)
    }

    const body = await request.json()
    const { hostId, checkInDate, checkOutDate, message, safetyAcknowledged } = body

    if (!hostId || !checkInDate || !checkOutDate || !message) {
      return fail('hostId, checkInDate, checkOutDate, and message are required', 400)
    }
    if (!safetyAcknowledged) return fail('Safety acknowledgement is required', 400)

    const checkIn  = new Date(checkInDate)
    const checkOut = new Date(checkOutDate)
    if (isNaN(checkIn) || isNaN(checkOut)) return fail('Invalid dates', 400)
    if (checkIn >= checkOut) return fail('Check-out must be after check-in', 400)

    // hostId may be either the HostProfile._id or the host's User._id
    const hostOid = new mongoose.Types.ObjectId(hostId)
    const hostProfile = await HostProfile.findOne({
      $or: [{ _id: hostOid }, { userId: hostOid }],
    })
    if (!hostProfile || !hostProfile.isAcceptingGuests || !hostProfile.isListingActive) {
      return fail('Host is not currently accepting guests', 400)
    }

    const hostUserId = hostProfile.userId.toString()
    if (hostUserId === session.user.id) return fail('You cannot request to stay with yourself', 400)

    const overlap = await HostingRequest.findOne({
      guestId: session.user.id,
      hostId: hostUserId,
      status: { $in: ['pending', 'accepted'] },
      checkInDate:  { $lt: checkOut },
      checkOutDate: { $gt: checkIn },
    })
    if (overlap) return fail('You already have a request with this host for overlapping dates', 409)

    const guest = await User.findById(session.user.id)
      .select('emergencyContactName emergencyContactPhone emergencyContactRelationship')
      .lean()

    const hostingRequest = await HostingRequest.create({
      guestId: session.user.id,
      hostId: hostUserId,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      message,
      safetyAcknowledged,
      guestEmergencyContactName:         guest?.emergencyContactName,
      guestEmergencyContactPhone:        guest?.emergencyContactPhone,
      guestEmergencyContactRelationship: guest?.emergencyContactRelationship,
    })

    await Notification.create({
      recipientId: hostUserId,
      type:        'new_request',
      title:       'New hosting request',
      body:        `${session.user.fullName} wants to stay with you`,
      link:        `/messages/${hostingRequest._id}`,
    })

    const host = await User.findById(hostUserId).select('email fullName emailNotifications').lean()
    if (host?.emailNotifications?.newRequest !== false) {
      sendEmail({
        to:      host.email,
        subject: 'New hosting request – SisterRoam',
        html:    `<p>Hi ${host.fullName},</p><p>${session.user.fullName} sent you a hosting request. <a href="${process.env.NEXTAUTH_URL}/messages/${hostingRequest._id}">View request</a></p>`,
      }).catch(console.error)
    }

    return ok(hostingRequest.toObject())
  } catch (e) {
    return handleError(e)
  }
}
