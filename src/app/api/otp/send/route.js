import { connectDB } from '@/lib/mongodb'
import OtpRecord from '@/models/OtpRecord'
import { sendOtpEmail } from '@/lib/resend'
import bcrypt from 'bcryptjs'

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export async function POST(request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 })
    }

    await connectDB()

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
    const recentCount = await OtpRecord.countDocuments({
      email,
      createdAt: { $gte: tenMinutesAgo },
    })

    if (recentCount >= 3) {
      return Response.json(
        { error: 'Too many OTP requests. Please wait 10 minutes.' },
        { status: 429 }
      )
    }

    const otp = generateOtp()
    const hashedOtp = await bcrypt.hash(otp, 10)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    await OtpRecord.create({ email, otp: hashedOtp, expiresAt })

    await sendOtpEmail({ to: email, otp })

    return Response.json({ success: true, message: 'Verification code sent to your email' })
  } catch (err) {
    console.error('[otp/send]', err)
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}
