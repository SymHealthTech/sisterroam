import { connectDB } from '@/lib/mongodb'
import Notification from '@/models/Notification'
import { ok, fail, connectAndAuth, handleError } from '@/lib/apiHelpers'

export async function GET() {
  try {
    const session = await connectAndAuth()

    const notifications = await Notification.find({ recipientId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()

    const unreadCount = notifications.filter(n => !n.isRead).length
    return ok({ notifications, unreadCount })
  } catch (e) {
    return handleError(e)
  }
}

export async function PATCH(request) {
  try {
    const session = await connectAndAuth()
    const { ids, all } = await request.json()

    const filter = { recipientId: session.user.id }
    if (!all) {
      if (!ids?.length) return fail('Provide ids or all: true', 400)
      filter._id = { $in: ids }
    }

    await Notification.updateMany(filter, { $set: { isRead: true } })
    return ok({ updated: true })
  } catch (e) {
    return handleError(e)
  }
}
