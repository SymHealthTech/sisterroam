import { connectDB } from '@/lib/mongodb'
import OtpRecord from '@/models/OtpRecord'
import User from '@/models/User'
import bcrypt from 'bcryptjs'

export async function POST(request) {
  try {
    const { email, otp } = await request.json()

    if (!email || !otp) {
      return Response.json({ error: 'Email and OTP are required' }, { status: 400 })
    }

    await connectDB()

    const emailNorm = email.toLowerCase().trim()

    const record = await OtpRecord.findOne({
      email: emailNorm,
      isVerified: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 })

    if (!record) {
      return Response.json({ error: 'OTP expired or not found' }, { status: 400 })
    }

    if (record.attempts >= 3) {
      return Response.json(
        { error: 'Too many attempts. Request a new OTP.' },
        { status: 400 }
      )
    }

    record.attempts += 1
    const isValid = await bcrypt.compare(otp, record.otp)

    if (!isValid) {
      await record.save()
      const remaining = 3 - record.attempts
      return Response.json(
        { error: `Incorrect OTP. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.` },
        { status: 400 }
      )
    }

    record.isVerified = true
    await record.save()

    // Pending signup → create the verified account now (deferred creation).
    if (record.passwordHash && record.fullName) {
      const existing = await User.findOne({ email: emailNorm }, '_id').lean()
      if (existing) {
        // Account already exists (e.g. the code was verified twice) — just make
        // sure it's flagged verified.
        await User.updateOne({ email: emailNorm }, { emailVerified: true })
      } else {
        const user = new User({
          fullName: record.fullName,
          email: emailNorm,
          phone: record.phone || undefined,
          emailVerified: true,
          phoneVerified: false,
          password: record.passwordHash,
        })
        // Password is already hashed — don't let the pre('save') hook hash it again.
        user.$locals.skipPasswordHash = true
        await user.save()
      }
      // Clear pending records for this email (they hold the password hash).
      await OtpRecord.deleteMany({ email: emailNorm })
    } else {
      // Non-signup OTP (e.g. a standalone email-verification): just flag any
      // existing user's email as verified.
      await User.findOneAndUpdate({ email: emailNorm }, { emailVerified: true })
    }

    return Response.json({ success: true, message: 'Email verified' })
  } catch (err) {
    console.error('[otp/verify]', err)
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}
