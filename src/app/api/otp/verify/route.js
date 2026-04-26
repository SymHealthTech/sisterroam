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

    const record = await OtpRecord.findOne({
      email,
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

    // Email OTP doubles as email verification — mark the user's email as verified
    await User.findOneAndUpdate({ email }, { emailVerified: true })

    return Response.json({ success: true, message: 'Email verified' })
  } catch (err) {
    console.error('[otp/verify]', err)
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}
