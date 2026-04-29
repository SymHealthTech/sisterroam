// Server-side SSE connection manager.
//
// IMPORTANT: module-level variables in Next.js are NOT reliably shared between
// different API routes — webpack compiles each route into its own chunk, and
// hot-reload in dev creates fresh module instances. We use `global` as a true
// singleton that survives across module re-instantiation and hot-reloads.
//
// Production note: on multi-instance deployments (Vercel serverless), each
// Lambda has its own `global`, so SSE events can only reach clients connected
// to the same instance. The ChatWindow polling fallback covers this case.

if (!global._sseConnections) global._sseConnections = new Map()
const connections = global._sseConnections

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
