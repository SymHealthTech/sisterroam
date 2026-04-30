import { connectAndAuth, ok, fail, handleError } from '@/lib/apiHelpers'
import User from '@/models/User'

export async function GET() {
  try {
    const session = await connectAndAuth()
    const user = await User.findById(session.user.id).select('+password').lean()
    if (!user) return fail('User not found', 404)

    delete user.password

    return ok({ ...user })
  } catch (e) {
    return handleError(e)
  }
}
