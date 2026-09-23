import Message from '@/models/Message'
import { sendToUser } from '@/lib/sse'

/**
 * Mark messages sent TO `userId` in the given conversations as delivered (✓✓)
 * or read (blue ✓✓), and tell each sender so her ticks update live.
 * Read always implies delivered. Best-effort: never throws into the caller.
 *
 * @param {string} userId          the recipient
 * @param {{ requestIds: any[], read?: boolean }} opts
 */
export async function markMessages(userId, { requestIds, read = false }) {
  try {
    if (!requestIds?.length) return
    const filter = { requestId: { $in: requestIds }, senderId: { $ne: userId }, messageType: { $ne: 'system' } }
    if (read) filter.isRead = false
    else Object.assign(filter, { isRead: false, deliveredAt: null })

    const pending = await Message.find(filter).select('_id senderId requestId').lean()
    if (!pending.length) return

    const now = new Date()
    const ids = pending.map((m) => m._id)
    if (read) {
      await Message.updateMany({ _id: { $in: ids } }, { $set: { isRead: true, readAt: now } })
    }
    await Message.updateMany({ _id: { $in: ids }, deliveredAt: null }, { $set: { deliveredAt: now } })

    // One event per sender per conversation.
    const groups = new Map()
    for (const m of pending) {
      const key = `${m.senderId}|${m.requestId}`
      if (!groups.has(key)) groups.set(key, { senderId: m.senderId.toString(), requestId: m.requestId.toString(), ids: [] })
      groups.get(key).ids.push(m._id.toString())
    }
    for (const g of groups.values()) {
      sendToUser(g.senderId, 'messages_status', {
        requestId: g.requestId,
        ids: g.ids,
        status: read ? 'read' : 'delivered',
        at: now.toISOString(),
      })
    }
  } catch (err) {
    console.error('[messageStatus]', err)
  }
}
