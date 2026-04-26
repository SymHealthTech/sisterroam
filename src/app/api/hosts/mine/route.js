import HostProfile from '@/models/HostProfile'
import { ok, connectAndAuth, handleError } from '@/lib/apiHelpers'

export async function GET() {
  try {
    const session = await connectAndAuth()
    const profile = await HostProfile.findOne({ userId: session.user.id }).lean()
    return ok(profile)
  } catch (e) {
    return handleError(e)
  }
}
