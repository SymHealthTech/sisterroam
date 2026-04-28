import { NextResponse } from 'next/server'
import { ok, fail, connectAndAuth, handleError } from '@/lib/apiHelpers'
import User from '@/models/User'
import Payment from '@/models/Payment'

export async function GET(request) {
  try {
    const session = await connectAndAuth()
    if (!session.user.isAdmin) return fail('Admin access required', 403)

    const { searchParams } = new URL(request.url)
    const page  = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = 30
    const skip  = (page - 1) * limit
    const q     = searchParams.get('q') || ''

    const filter = q
      ? { $or: [
          { fullName: { $regex: q, $options: 'i' } },
          { email:    { $regex: q, $options: 'i' } },
        ]}
      : {}

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('fullName email verificationTier createdAt profilePhotoUrl'),
      User.countDocuments(filter),
    ])

    const userIds = users.map(u => u._id)
    const payments = await Payment.find({
      userId: { $in: userIds },
      purpose: 'verified_badge',
    }).sort({ createdAt: -1 })

    const paymentByUser = {}
    for (const p of payments) {
      const uid = p.userId.toString()
      if (!paymentByUser[uid]) paymentByUser[uid] = p
    }

    const result = users.map(u => ({
      _id:              u._id,
      fullName:         u.fullName,
      email:            u.email,
      verificationTier: u.verificationTier,
      profilePhotoUrl:  u.profilePhotoUrl,
      createdAt:        u.createdAt,
      payment:          paymentByUser[u._id.toString()] ?? null,
    }))

    return ok({ users: result, total, page, pages: Math.ceil(total / limit) })
  } catch (e) {
    return handleError(e)
  }
}
