import { connectDB } from '@/lib/mongodb'
import RateLimit from '@/models/RateLimit'

/**
 * Simple fixed-window per-key rate limit backed by MongoDB (works across the
 * serverless instances Vercel spins up, unlike an in-memory counter).
 *
 * @param {string} key                unique bucket, e.g. `upload-sig:<userId>`
 * @param {{ max: number, windowMs: number }} opts
 * @returns {Promise<{ allowed: boolean, retryAfterMs?: number }>}
 */
export async function checkRateLimit(key, { max, windowMs }) {
  try {
    await connectDB()
    const now = Date.now()
    const doc = await RateLimit.findOne({ key })

    if (!doc || now - new Date(doc.windowStart).getTime() > windowMs) {
      // New (or expired) window — start fresh.
      await RateLimit.updateOne(
        { key },
        { $set: { windowStart: new Date(now), count: 1 } },
        { upsert: true },
      )
      return { allowed: true }
    }

    if (doc.count >= max) {
      return { allowed: false, retryAfterMs: windowMs - (now - new Date(doc.windowStart).getTime()) }
    }

    await RateLimit.updateOne({ key }, { $inc: { count: 1 } })
    return { allowed: true }
  } catch {
    // Fail open — a rate-limiter outage must never block legitimate uploads.
    return { allowed: true }
  }
}
