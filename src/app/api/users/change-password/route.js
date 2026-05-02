import User from '@/models/User'
import { ok, fail, connectAndAuth, handleError } from '@/lib/apiHelpers'

export async function POST(request) {
  try {
    const session = await connectAndAuth()
    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) return fail('Both current and new password are required')
    if (newPassword.length < 8 || !/\d/.test(newPassword)) {
      return fail('New password must be at least 8 characters with at least one number')
    }

    const user = await User.findById(session.user.id).select('+password')
    if (!user) return fail('User not found', 404)

    const isMatch = await user.comparePassword(currentPassword)
    if (!isMatch) return fail('Current password is incorrect')

    user.password = newPassword
    await user.save()

    return ok({ message: 'Password updated successfully' })
  } catch (e) {
    return handleError(e)
  }
}
