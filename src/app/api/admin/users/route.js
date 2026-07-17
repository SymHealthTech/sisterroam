import { ok, fail, connectAndAuth, handleError } from '@/lib/apiHelpers'
import User from '@/models/User'
import Payment from '@/models/Payment'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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
          { city:     { $regex: q, $options: 'i' } },
          { country:  { $regex: q, $options: 'i' } },
        ]}
      : {}

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('fullName email verificationTier createdAt profilePhotoUrl age city country isAdmin'),
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
      age:              u.age ?? null,
      city:             u.city ?? null,
      country:          u.country ?? null,
      isAdmin:          u.isAdmin ?? false,
      payment:          paymentByUser[u._id.toString()] ?? null,
    }))

    return ok({ users: result, total, page, pages: Math.ceil(total / limit) })
  } catch (e) {
    return handleError(e)
  }
}

// Admin creates a sister's account directly — no OTP step. Email is marked
// verified because the admin is vouching for it (used when a sister can't
// receive/verify the code herself). She fills in her profile after first login
// and can change this password from settings.
export async function POST(request) {
  try {
    const session = await connectAndAuth()
    if (!session.user.isAdmin) return fail('Admin access required', 403)

    const { fullName, email, password } = await request.json()

    if (!fullName || !email || !password) {
      return fail('Name, email and password are all required', 400)
    }
    if (fullName.trim().length < 2) {
      return fail('Name must be at least 2 characters', 400)
    }
    if (!EMAIL_RE.test(email)) {
      return fail('Invalid email format', 400)
    }
    if (password.length < 8 || !/\d/.test(password)) {
      return fail('Password must be at least 8 characters with at least one number', 400)
    }

    const emailNorm = email.toLowerCase().trim()
    const existing = await User.findOne({ email: emailNorm }, '_id').lean()
    if (existing) return fail('A user with this email already exists', 409)

    // Pass plain password — the User model's pre('save') hook hashes it and
    // generates a username.
    const user = new User({
      fullName: fullName.trim(),
      email: emailNorm,
      password,
      emailVerified: true, // admin-vouched, bypasses OTP
      phoneVerified: false,
    })
    await user.save()

    return ok({
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
    })
  } catch (e) {
    return handleError(e)
  }
}

export async function DELETE(request) {
  try {
    const session = await connectAndAuth()
    if (!session.user.isAdmin) return fail('Admin access required', 403)

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return fail('User id is required', 400)

    if (id === session.user.id) return fail('You cannot delete your own account', 400)

    const target = await User.findById(id).select('isAdmin fullName')
    if (!target) return fail('User not found', 404)
    if (target.isAdmin) return fail('Admin accounts cannot be deleted', 403)

    // Confirm whether this member actually paid the verification fee — this is
    // guarded behind a double-confirmation on the client.
    const paidBadge = await Payment.exists({
      userId: id,
      purpose: 'verified_badge',
      status: 'completed',
    })
    const confirmedPaid = searchParams.get('confirmPaid') === 'true'
    if (paidBadge && !confirmedPaid) {
      return fail('This member paid the verification fee — double confirmation required', 409)
    }

    await Promise.all([
      User.deleteOne({ _id: id }),
      Payment.deleteMany({ userId: id }),
    ])

    return ok({ deleted: id, name: target.fullName })
  } catch (e) {
    return handleError(e)
  }
}
