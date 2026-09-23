import { connectDB } from '@/lib/mongodb'
import HostingRequest from '@/models/HostingRequest'
import Message from '@/models/Message'
import Notification from '@/models/Notification'
import User from '@/models/User'
import { sendToUser } from '@/lib/sse'
import { sendNewDirectMessageEmail } from '@/lib/resend'
import { ok, fail, getSession, requireVerified, handleError } from '@/lib/apiHelpers'
import { stripFormatting } from '@/lib/messageText'
import { markMessages } from '@/lib/messageStatus'

async function getRequestAndVerify(requestId, userId) {
  const req = await HostingRequest.findById(requestId)
  if (!req) {
    const e = new Error('Request not found')
    e.status = 404
    throw e
  }
  const isParticipant = req.guestId.toString() === userId || req.hostId.toString() === userId
  if (!isParticipant) {
    const e = new Error('Access denied')
    e.status = 403
    throw e
  }
  return req
}

export async function GET(request, { params }) {
  try {
    await connectDB()
    // Any participant may READ a conversation, even a sister who is still under
    // review — she can see messages sent to her, but only verified sisters can reply.
    const session = await getSession()
    const { requestId } = await params

    const conversation = await getRequestAndVerify(requestId, session.user.id)

    // If this user cleared the chat, only show messages sent after that moment.
    const cleared = conversation.clearedAt?.find(
      c => c.user?.toString() === session.user.id
    )?.at
    // Hide messages she deleted "for me".
    const msgFilter = { requestId, deletedFor: { $ne: session.user.id } }
    if (cleared) msgFilter.createdAt = { $gt: cleared }

    const messages = await Message.find(msgFilter)
      .sort({ createdAt: 1 })
      .populate('senderId', 'fullName username profilePhotoUrl')
      .lean()

    // Opening the conversation reads the other party's messages (blue ✓✓).
    await markMessages(session.user.id, { requestIds: [conversation._id], read: true })

    // Never expose who else hid a message.
    return ok(messages.map(({ deletedFor, ...m }) => m))
  } catch (e) {
    return handleError(e)
  }
}

// Mark the other party's messages read while the chat is open (e.g. a message
// arrived live over SSE) so the sender's ticks turn blue straight away.
export async function PATCH(request, { params }) {
  try {
    await connectDB()
    const session = await getSession()
    const { requestId } = await params
    const conversation = await getRequestAndVerify(requestId, session.user.id)
    await markMessages(session.user.id, { requestIds: [conversation._id], read: true })
    return ok({ read: true })
  } catch (e) {
    return handleError(e)
  }
}

export async function POST(request, { params }) {
  try {
    await connectDB()
    const session = await getSession()
    requireVerified(session)
    const { requestId } = await params

    const req = await getRequestAndVerify(requestId, session.user.id)

    const { content } = await request.json()
    if (!content?.trim()) return fail('Message content is required', 400)

    const message = await Message.create({
      requestId,
      senderId: session.user.id,
      content: content.trim(),
    })

    await message.populate('senderId', 'fullName username profilePhotoUrl')

    const preview = content.trim().slice(0, 100)
    const now = new Date()

    // Update denormalized lastMessage fields on the request. Clearing deletedBy
    // resurfaces the thread for anyone who had removed it from their list.
    await HostingRequest.findByIdAndUpdate(requestId, {
      lastMessageAt: now,
      lastMessagePreview: preview,
      deletedBy: [],
    })

    const messageObj = message.toObject()
    const recipientId = req.guestId.toString() === session.user.id
      ? req.hostId.toString()
      : req.guestId.toString()

    // Push real-time events to recipient via SSE
    sendToUser(recipientId, 'new_message', {
      requestId,
      message: {
        _id:        messageObj._id,
        content:    messageObj.content,
        senderId:   messageObj.senderId,
        createdAt:  messageObj.createdAt,
      },
    })

    sendToUser(recipientId, 'conversation_update', {
      requestId,
      lastMessage: preview,
      lastMessageAt: now.toISOString(),
      senderName: session.user.fullName,
    })

    const notif = await Notification.create({
      recipientId,
      type: 'new_message',
      title: 'New message',
      body: `${session.user.fullName}: ${stripFormatting(content).slice(0, 100)}`,
      link: `/messages/${requestId}`,
    })

    sendToUser(recipientId, 'new_notification', {
      notification: {
        _id:       notif._id,
        type:      notif.type,
        title:     notif.title,
        body:      notif.body,
        link:      notif.link,
        createdAt: notif.createdAt,
      },
    })

    // Email the recipient about a new message — at most ONE such email per member
    // per 24 hours (across all her conversations), so an active chat doesn't
    // flood her inbox but a message after a quiet day brings her back.
    // Claimed atomically, so two messages at once can't both send an email.
    const DAY_MS = 24 * 60 * 60 * 1000
    const claimed = await User.findOneAndUpdate(
      {
        _id: recipientId,
        email: { $exists: true, $ne: '' },
        'emailNotifications.newMessage': { $ne: false },
        $or: [
          { lastMessageEmailAt: null },
          { lastMessageEmailAt: { $lt: new Date(Date.now() - DAY_MS) } },
        ],
      },
      { $set: { lastMessageEmailAt: new Date() } },
      { projection: 'email fullName lastMessageEmailAt' },
    ).lean()
    if (claimed) {
      const isNewConversation =
        req.requestType === 'direct' && (await Message.countDocuments({ requestId })) === 1
      sendNewDirectMessageEmail({
        recipient: claimed,
        senderName: session.user.fullName,
        preview: stripFormatting(content),
        requestId,
        isNewConversation,
      }).catch((err) => {
        console.error('[message email]', err)
        // Not sent — give the 24-hour slot back so the next message can try.
        User.updateOne(
          { _id: recipientId },
          claimed.lastMessageEmailAt
            ? { $set: { lastMessageEmailAt: claimed.lastMessageEmailAt } }
            : { $unset: { lastMessageEmailAt: '' } },
        ).catch(() => {})
      })
    }

    return ok(messageObj)
  } catch (e) {
    return handleError(e)
  }
}

// Delete a conversation from the current user's message list (per-user soft
// delete). A later message resurfaces it. Once BOTH participants of a DIRECT
// chat have removed it, the conversation and its messages are permanently
// cleaned up.
export async function DELETE(request, { params }) {
  try {
    await connectDB()
    const session = await getSession()
    const { requestId } = await params

    const req = await getRequestAndVerify(requestId, session.user.id)

    // Hide from this user's list AND record the clear time so old messages stay
    // gone for her even if the thread later reappears from a new message.
    await HostingRequest.updateOne(
      { _id: requestId },
      { $pull: { clearedAt: { user: session.user.id } } }
    )
    await HostingRequest.updateOne(
      { _id: requestId },
      {
        $addToSet: { deletedBy: session.user.id },
        $push: { clearedAt: { user: session.user.id, at: new Date() } },
      }
    )

    // Garbage-collect a direct conversation once both sides have deleted it.
    if (req.requestType === 'direct') {
      const updated = await HostingRequest.findById(requestId)
        .select('guestId hostId deletedBy')
        .lean()
      const both = [updated.guestId.toString(), updated.hostId.toString()]
      const deleted = new Set((updated.deletedBy ?? []).map(String))
      if (both.every(id => deleted.has(id))) {
        await Promise.all([
          Message.deleteMany({ requestId }),
          HostingRequest.deleteOne({ _id: requestId }),
        ])
      }
    }

    return ok({ deleted: true })
  } catch (e) {
    return handleError(e)
  }
}
