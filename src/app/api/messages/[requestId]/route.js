import { connectDB } from '@/lib/mongodb'
import HostingRequest from '@/models/HostingRequest'
import Message from '@/models/Message'
import Notification from '@/models/Notification'
import { sendToUser } from '@/lib/sse'
import { ok, fail, getSession, handleError } from '@/lib/apiHelpers'

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
    const session = await getSession()
    const { requestId } = await params

    await getRequestAndVerify(requestId, session.user.id)

    const messages = await Message.find({ requestId })
      .sort({ createdAt: 1 })
      .populate('senderId', 'fullName username profilePhotoUrl')
      .lean()

    // Mark messages from the other party as read
    await Message.updateMany(
      { requestId, senderId: { $ne: session.user.id }, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    )

    return ok(messages)
  } catch (e) {
    return handleError(e)
  }
}

export async function POST(request, { params }) {
  try {
    await connectDB()
    const session = await getSession()
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

    // Update denormalized lastMessage fields on the request
    await HostingRequest.findByIdAndUpdate(requestId, {
      lastMessageAt: now,
      lastMessagePreview: preview,
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
      body: `${session.user.fullName}: ${content.slice(0, 100)}`,
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

    return ok(messageObj)
  } catch (e) {
    return handleError(e)
  }
}
