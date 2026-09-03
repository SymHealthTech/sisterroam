import { connectDB } from '@/lib/mongodb'
import Message from '@/models/Message'
import HostingRequest from '@/models/HostingRequest'
import { ok, fail, getSession, handleError } from '@/lib/apiHelpers'

// Delete a single message. Only the sender may delete her own message.
export async function DELETE(request, { params }) {
  try {
    await connectDB()
    const session = await getSession()
    const { messageId } = await params

    const message = await Message.findById(messageId)
    if (!message) return fail('Message not found', 404)
    if (message.senderId.toString() !== session.user.id) {
      return fail('You can only delete your own messages', 403)
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

    return ok({ deleted: true })
  } catch (e) {
    return handleError(e)
  }
}
