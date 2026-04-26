// Server-side SSE connection manager.
// In-memory Map — works perfectly in dev and single-server deployments.
// On Vercel serverless, SSE connections live in the long-running SSE function
// instance; push from other routes in the same instance reaches connected clients.
// Clients auto-reconnect every ~60s (Vercel free-tier maxDuration), so the UX
// degrades gracefully rather than breaking.

const connections = new Map() // userId → Set<ReadableStreamDefaultController>
const encoder = new TextEncoder()

export function addConnection(userId, controller) {
  if (!connections.has(userId)) connections.set(userId, new Set())
  connections.get(userId).add(controller)
  return () => removeConnection(userId, controller)
}

export function removeConnection(userId, controller) {
  const set = connections.get(userId)
  if (!set) return
  set.delete(controller)
  if (set.size === 0) connections.delete(userId)
}

export function sendToUser(userId, eventType, data) {
  const set = connections.get(userId)
  if (!set || set.size === 0) return
  const msg = encoder.encode(`event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`)
  for (const ctrl of [...set]) {
    try {
      ctrl.enqueue(msg)
    } catch {
      removeConnection(userId, ctrl)
    }
  }
}

export function sendToUsers(userIds, eventType, data) {
  for (const id of userIds) sendToUser(id, eventType, data)
}

export function broadcastToAll(eventType, data) {
  for (const userId of connections.keys()) sendToUser(userId, eventType, data)
}

export function getOnlineUsers() {
  return [...connections.keys()]
}

export function isUserOnline(userId) {
  return connections.has(userId) && connections.get(userId).size > 0
}
