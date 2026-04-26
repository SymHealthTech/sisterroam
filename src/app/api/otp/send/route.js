import { connectDB } from '@/lib/mongodb'
import OtpRecord from '@/models/OtpRecord'
import { sendOtpEmail } from '@/lib/resend'
import bcrypt from 'bcryptjs'

// TODO: When budget allows, add WhatsApp OTP via WATI (wati.io)
// WATI free tier: 1,000 messages. After that ~$0.005 per message.
// Indian users strongly prefer WhatsApp over email for OTP.
// To implement: replace sendOtpEmail with a WATI API call.
// WATI endpoint: POST https://live-server-xxxx.wati.io/api/v1/sendTemplateMessage
// Template must be pre-approved by WhatsApp Business.

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
