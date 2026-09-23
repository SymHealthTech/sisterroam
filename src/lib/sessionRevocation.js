import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'

/**
 * "Sign out everywhere when the password changes."
 *
 * Every session remembers when it signed in (token.authAt). When a member
 * changes or resets her password we store User.passwordChangedAt; any session
 * that signed in BEFORE that moment is treated as signed out — both in API
 * routes (lib/auth.js jwt callback) and on page loads (proxy.js).
 *
 * The lookup is cached per server instance for 30 s so it costs at most one
 * small indexed read per member per instance per 30 s. Worst case, another
 * device stays signed in for up to 30 s after the change.
 */
const TTL_MS = 30 * 1000
if (!global._pwdChangedCache) global._pwdChangedCache = new Map()
const cache = global._pwdChangedCache

async function getPasswordChangedAt(userId) {
  const hit = cache.get(userId)
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value
  await connectDB()
  const user = await User.findById(userId).select('passwordChangedAt').lean()
  // A deleted account has no passwordChangedAt; lib/auth.js handles deletion.
  const value = user?.passwordChangedAt ? new Date(user.passwordChangedAt).getTime() : 0
  cache.set(userId, { value, at: Date.now() })
  return value
}

/** Call right after changing a password so this instance sees it immediately. */
export function forgetPasswordChange(userId) {
  cache.delete(String(userId))
}

/**
 * @param {string} userId
 * @param {number} authAt  ms timestamp the session signed in (0/undefined = unknown)
 * @returns {Promise<boolean>} true if this session must be signed out
 */
export async function isSessionRevoked(userId, authAt) {
  if (!userId) return false
  try {
    const changedAt = await getPasswordChangedAt(String(userId))
    if (!changedAt) return false
    return !authAt || authAt < changedAt
  } catch {
    return false // never lock members out because of a DB hiccup
  }
}
