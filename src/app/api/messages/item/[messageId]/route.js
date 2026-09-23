import { connectDB } from '@/lib/mongodb'
import Message from '@/models/Message'
import HostingRequest from '@/models/HostingRequest'
import { ok, fail, getSession, handleError } from '@/lib/apiHelpers'
import { sendToUser } from '@/lib/sse'

// Delete a single message.
//   ?for=me       → hide it from my own view only (any message in my conversation)
//   (default) / ?for=everyone → remove it for both people (sender only)
export async function DELETE(request, { params }) {
  try {
    await connectDB()
    const session = await getSession()
    const { messageId } = await params
    const scope = new URL(request.url).searchParams.get('for') === 'me' ? 'me' : 'everyone'

    const message = await Message.findById(messageId)
    if (!message) return fail('Message not found', 404)

    if (scope === 'me') {
      const convo = await HostingRequest.findById(message.requestId).select('guestId hostId').lean()
      const uid = session.user.id
      if (!convo || (convo.guestId.toString() !== uid && convo.hostId.toString() !== uid)) {
        return fail('Access denied', 403)
      }
      await Message.updateOne({ _id: messageId }, { $addToSet: { deletedFor: uid } })
      return ok({ deleted: true, for: 'me' })
    }

    if (message.senderId.toString() !== session.user.id) {
      return fail('You can only delete your own messages for everyone', 403)
    }

    const requestId = message.requestId
    await Message.deleteOne({ _id: messageId })

    // Keep the conversation preview in sync if we removed the latest message.
    const last = await Message.findOne({ requestId })
      .sort({ createdAt: -1 })
      .select('content createdAt')
      .lean()
    await HostingRequest.updateOne(
      { _id: requestId },
      last
        ? { lastMessagePreview: last.content.slice(0, 100), lastMessageAt: last.createdAt }
        : { $unset: { lastMessagePreview: '', lastMessageAt: '' } }
    )

    // Remove it from the other person's open chat right away.
    const convo = await HostingRequest.findById(requestId).select('guestId hostId').lean()
    if (convo) {
      const other = convo.guestId.toString() === session.user.id ? convo.hostId : convo.guestId
      sendToUser(other.toString(), 'message_deleted', { requestId: requestId.toString(), id: messageId })
    }

    return ok({ deleted: true, for: 'everyone' })
  } catch (e) {
    return handleError(e)
  }
}
