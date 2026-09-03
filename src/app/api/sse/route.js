import { getSession } from '@/lib/apiHelpers'
import { connectDB } from '@/lib/mongodb'
import Notification from '@/models/Notification'
import { addConnection, removeConnection } from '@/lib/sse'

const encoder = new TextEncoder()

export async function GET(request) {
  // getSession() throws (status 401) when unauthenticated — catch it so an
  // unauthenticated EventSource gets a clean 401 instead of a 500.
  let session
  try {
    session = await getSession()
  } catch {
    return new Response('Unauthorized', { status: 401 })
  }

  const userId = session.user.id
  // The client only sets catchup=1 on its FIRST connect. Reconnects (the 60s
  // stream timeout) omit it, so we skip the DB query and avoid recurring Fluid
  // Active CPU per user per minute.
  const wantsCatchup = new URL(request.url).searchParams.get('catchup') === '1'

  const stream = new ReadableStream({
    async start(controller) {
      const cleanup = addConnection(userId, controller)

      controller.enqueue(
        encoder.encode('event: connected\ndata: {"status":"connected"}\n\n')
      )

      // Send any unread notifications immediately — only on the first connect
      if (wantsCatchup) {
        try {
          await connectDB()
          const pending = await Notification.find({
            recipientId: userId,
            isRead: false,
          })
            .sort({ createdAt: -1 })
            .limit(20)
            .lean()

          if (pending.length > 0) {
            controller.enqueue(
              encoder.encode(
                `event: pending_notifications\ndata: ${JSON.stringify({ notifications: pending, unreadCount: pending.length })}\n\n`
              )
            )
          }
        } catch {
          // Non-critical — continue even if this fails
        }
      }

      request.signal.addEventListener('abort', () => {
        cleanup()
        try { controller.close() } catch {}
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
