import cloudinary from '@/lib/cloudinary'
import { applyModerationDecision } from '@/lib/moderation'

/**
 * Cloudinary moderation webhook.
 *
 * Configure a notification URL in the Cloudinary console (Settings → Webhooks,
 * or the account's global `notification_url`) pointing at:
 *   https://<your-domain>/api/cloudinary/moderation
 *
 * Cloudinary POSTs here whenever a manual-moderation decision is made (whether
 * from our own admin queue's api.update call or from the Cloudinary Media
 * Library). We verify the signature, then sync our DB via applyModerationDecision.
 */
export async function POST(request) {
  const raw = await request.text()
  const signature = request.headers.get('x-cld-signature')
  const timestamp = request.headers.get('x-cld-timestamp')

  // Verify the payload really came from Cloudinary.
  try {
    const valid = cloudinary.utils.verifyNotificationSignature(raw, timestamp, signature)
    if (!valid) {
      return Response.json({ error: 'Invalid signature' }, { status: 401 })
    }
  } catch {
    return Response.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload
  try {
    payload = JSON.parse(raw)
  } catch {
    return Response.json({ error: 'Bad payload' }, { status: 400 })
  }

  // We only care about moderation notifications. Cloudinary sends the moderation
  // outcome either at the top level or inside a `moderation` array depending on
  // the notification type — handle both shapes.
  try {
    const resourceType = payload.resource_type === 'video' ? 'video' : 'image'
    let status = payload.moderation_status
    if (!status && Array.isArray(payload.moderation)) {
      status = payload.moderation[0]?.status
    }
    if ((status === 'approved' || status === 'rejected') && payload.public_id) {
      await applyModerationDecision(payload.public_id, status, resourceType)
    }
  } catch (err) {
    console.error('[cloudinary moderation webhook]', err)
    // Still return 200 so Cloudinary doesn't retry forever on a persistent error.
  }

  return Response.json({ received: true })
}
