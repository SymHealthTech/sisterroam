import mongoose from 'mongoose'
import { connectAndAuth, requireVerified, ok, fail, handleError } from '@/lib/apiHelpers'
import HostingRequest from '@/models/HostingRequest'
import User from '@/models/User'

export async function POST(request) {
  try {
    const session = await connectAndAuth()
    requireVerified(session)

    const { recipientId } = await request.json()
    if (!recipientId) return fail('recipientId is required')
    if (recipientId === session.user.id) return fail('Cannot start a conversation with yourself')

    const uid = new mongoose.Types.ObjectId(session.user.id)
    const rid = new mongoose.Types.ObjectId(recipientId)

    // Return existing direct conversation if one already exists
    const existing = await HostingRequest.findOne({
      requestType: 'direct',
      $or: [
        { guestId: uid, hostId: rid },
        { guestId: rid, hostId: uid },
      ],
    }).lean()

    if (existing) return ok({ requestId: existing._id })

    // Verify recipient is a real, non-basic member
    const recipient = await User.findById(rid)
      .select('verificationTier isActive isSuspended isPermanentlyBanned')
      .lean()

    if (!recipient || recipient.verificationTier === 'basic') {
      return fail('Recipient not found or not verified', 404)
    }
    if (recipient.isSuspended || recipient.isPermanentlyBanned) {
      return fail('Cannot message this user', 403)
    }

    const conversation = await HostingRequest.create({
      guestId: uid,
      hostId: rid,
      requestType: 'direct',
      status: 'accepted',
    })

    return ok({ requestId: conversation._id })
  } catch (e) {
    return handleError(e)
  }
}
