import User from '@/models/User'
import VerificationRequest from '@/models/VerificationRequest'
import { ok, connectAndAuth, handleError } from '@/lib/apiHelpers'

export async function GET() {
  try {
    const session = await connectAndAuth()
    const [user, verification] = await Promise.all([
      User.findById(session.user.id)
        .select('email phone emailVerified phoneVerified verificationTier')
        .lean(),
      VerificationRequest.findOne({ userId: session.user.id })
        .sort({ createdAt: -1 })
        .lean(),
    ])
    return ok({ user, verification })
  } catch (e) {
    return handleError(e)
  }
}
