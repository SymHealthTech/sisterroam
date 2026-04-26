import { connectDB } from '@/lib/mongodb'
import HostingRequest from '@/models/HostingRequest'
import HostProfile from '@/models/HostProfile'
import Notification from '@/models/Notification'
import SafetyCheckin from '@/models/SafetyCheckin'
import User from '@/models/User'
import { ok, fail, getSession, handleError } from '@/lib/apiHelpers'
import { sendEmail } from '@/lib/resend'
import { sendToUser } from '@/lib/sse'

const USER_PREVIEW = 'fullName username profilePhotoUrl city verificationTier'

const VALID_TRANSITIONS = {
  pending:  ['accepted', 'declined', 'cancelled'],
  accepted: ['completed', 'cancelled'],
}

export async function GET(request, { params }) {
  try {
    await connectDB()
    const session = await getSession()
    const { id } = await params

    const req = await HostingRequest.findById(id)
      .populate('guestId', USER_PREVIEW)
      .populate('hostId',  USER_PREVIEW)
      .lean()

    if (!req) return fail('Request not found', 404)

    const isParticipant =
      req.guestId._id.toString() === session.user.id ||
      req.hostId._id.toString()  === session.user.id
    if (!isParticipant) return fail('Access denied', 403)

    return ok(req)
  } catch (e) {
    return handleError(e)
  }
}

export async function PATCH(request, { params }) {
  try {
    await connectDB()
    const session = await getSession()
    const { id } = await params
    const { status, declineReason } = await request.json()

    const req = await HostingRequest.findById(id)
    if (!req) return fail('Request not found', 404)

    const isGuest = req.guestId.toString() === session.user.id
    const isHost  = req.hostId.toString()  === session.user.id
    if (!isGuest && !isHost) return fail('Access denied', 403)

    if (status === 'accepted' || status === 'declined') {
      if (!isHost) return fail('Only the host can accept or decline', 403)
    }
    if (status === 'cancelled') {
      if (!isGuest) return fail('Only the guest can cancel', 403)
    }

    const allowed = VALID_TRANSITIONS[req.status] ?? []
    if (!allowed.includes(status)) {
      return fail(`Cannot transition from "${req.status}" to "${status}"`, 400)
    }

    req.status = status
    if (declineReason) req.declineReason = declineReason
    await req.save()

    if (status === 'accepted') {
      // Schedule 3 safety check-ins for the guest
      try {
        const checkIn  = new Date(req.checkInDate)
        const checkOut = new Date(req.checkOutDate)

        const arrival = new Date(checkIn)
        arrival.setUTCHours(14, 0, 0, 0)

        const morning = new Date(checkIn)
        morning.setUTCDate(morning.getUTCDate() + 1)
        morning.setUTCHours(9, 0, 0, 0)

        const departure = new Date(checkOut)
        departure.setUTCHours(10, 0, 0, 0)

        await SafetyCheckin.insertMany([
          { requestId: req._id, userId: req.guestId, checkinType: 'arrival',   scheduledAt: arrival   },
          { requestId: req._id, userId: req.guestId, checkinType: 'morning',   scheduledAt: morning   },
          { requestId: req._id, userId: req.guestId, checkinType: 'departure', scheduledAt: departure },
        ])
      } catch (checkinErr) {
        console.error('[checkins] Failed to create check-ins:', checkinErr)
      }

      await Notification.create({
        recipientId: req.guestId,
        type:        'request_accepted',
        title:       'Request accepted!',
        body:        'Your hosting request was accepted',
        link:        `/messages/${req._id}`,
      })
      const guest = await User.findById(req.guestId).select('email fullName emailNotifications').lean()
      if (guest?.emailNotifications?.requestAccepted !== false) {
        sendEmail({
          to:      guest.email,
          subject: 'Your hosting request was accepted – SisterRoam',
          html:    `<p>Hi ${guest.fullName},</p><p>Your hosting request was accepted. <a href="${process.env.NEXTAUTH_URL}/messages/${req._id}">View details</a></p>`,
        }).catch(console.error)
      }
    }

    if (status === 'declined') {
      await Notification.create({
        recipientId: req.guestId,
        type:        'request_declined',
        title:       'Request declined',
        body:        'Your hosting request was not accepted this time',
        link:        `/messages/${req._id}`,
      })
      const guest = await User.findById(req.guestId).select('email fullName emailNotifications').lean()
      if (guest?.emailNotifications?.requestDeclined !== false) {
        sendEmail({
          to:      guest.email,
          subject: 'Update on your hosting request – SisterRoam',
          html:    `<p>Hi ${guest.fullName},</p><p>Unfortunately your hosting request was not accepted this time.</p>`,
        }).catch(console.error)
      }
    }

    if (status === 'completed') {
      await Promise.all([
        User.findByIdAndUpdate(req.guestId, { $inc: { totalStays: 1 } }),
        HostProfile.findOneAndUpdate({ userId: req.hostId }, { $inc: { totalStays: 1 } }),
      ])
    }

    // Notify both parties of status change via SSE
    sendToUser(req.guestId.toString(), 'request_update', { requestId: id, status })
    sendToUser(req.hostId.toString(),  'request_update', { requestId: id, status })

    return ok(req.toObject())
  } catch (e) {
    return handleError(e)
  }
}
