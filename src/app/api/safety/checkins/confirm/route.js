import { connectDB } from '@/lib/mongodb'
import SafetyCheckin from '@/models/SafetyCheckin'
import HostingRequest from '@/models/HostingRequest'
import { ok, fail, getSession, handleError } from '@/lib/apiHelpers'

export async function POST(request) {
  try {
    await connectDB()
    const session = await getSession()
    const { requestId, checkinType } = await request.json()

    if (!requestId || !checkinType) return fail('requestId and checkinType are required', 400)

    // Verify participation
    const req = await HostingRequest.findById(requestId).lean()
    if (!req) return fail('Request not found', 404)

    if (req.guestId.toString() !== session.user.id) return fail('Access denied', 403)

    const checkin = await SafetyCheckin.findOneAndUpdate(
      { requestId, userId: session.user.id, checkinType, confirmedAt: null },
      { $set: { confirmedAt: new Date() } },
      { new: true }
    )

    if (!checkin) return fail('Check-in not found or already confirmed', 404)

    return ok(checkin.toObject())
  } catch (e) {
    return handleError(e)
  }
}
