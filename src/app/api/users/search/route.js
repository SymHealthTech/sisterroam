import User from '@/models/User'
import { ok, fail, connectAndAuth, handleError } from '@/lib/apiHelpers'

export async function GET(request) {
  try {
    const session = await connectAndAuth()
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim()

    if (!q || q.length < 2) return fail('Query too short', 400)

    const users = await User.find({
      _id: { $ne: session.user.id },
      verificationTier: { $in: ['verified', 'trusted'] },
      isActive: true,
      isSuspended: { $ne: true },
      isPermanentlyBanned: { $ne: true },
      fullName: { $regex: q, $options: 'i' },
    })
      .select('fullName username profilePhotoUrl city country verificationTier')
      .limit(10)
      .lean()

    return ok(users)
  } catch (e) {
    return handleError(e)
  }
}
