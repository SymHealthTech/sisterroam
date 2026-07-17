import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import OtpRecord from '@/models/OtpRecord'
import { sendOtpEmail } from '@/lib/resend'
import bcrypt from 'bcryptjs'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^\+[1-9]\d{6,14}$/

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export async function POST(request) {
  try {
    const { fullName, email, password, phone } = await request.json()

    if (!fullName || !email || !password) {
      return Response.json({ error: 'All fields are required' }, { status: 400 })
    }
    if (!EMAIL_RE.test(email)) {
      return Response.json({ error: 'Invalid email format' }, { status: 400 })
    }
    if (password.length < 8 || !/\d/.test(password)) {
      return Response.json(
        { error: 'Password must be at least 8 characters with at least one number' },
        { status: 400 }
      )
    }
    if (phone && !PHONE_RE.test(phone)) {
      return Response.json(
        { error: 'Phone must include country code (e.g. +919876543210)' },
        { status: 400 }
      )
    }

    await connectDB()

    const emailNorm = email.toLowerCase().trim()

    // IMPORTANT: nothing is written to the User collection here. Only an
    // already-verified real account blocks signup. The account itself is created
    // later, in /api/otp/verify, once the emailed code is confirmed.
    const [emailTaken, phoneTaken] = await Promise.all([
      User.findOne({ email: emailNorm }, '_id').lean(),
      phone ? User.findOne({ phone }, '_id').lean() : null,
    ])
    if (emailTaken) return Response.json({ error: 'Email already registered' }, { status: 409 })
    if (phoneTaken) return Response.json({ error: 'Phone already registered' }, { status: 409 })

    // Rate-limit OTPs per email (covers the initial send + resends).
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
    const recentCount = await OtpRecord.countDocuments({
      email: emailNorm,
      createdAt: { $gte: tenMinutesAgo },
    })
    if (recentCount >= 3) {
      return Response.json(
        { error: 'Too many attempts. Please wait 10 minutes and try again.' },
        { status: 429 }
      )
    }

    const otp = generateOtp()
    const [hashedOtp, passwordHash] = await Promise.all([
      bcrypt.hash(otp, 8), // OTP: cost 8 is enough (rate-limited, expires in 10 min)
      bcrypt.hash(password, 12), // account password: same cost as the User model
    ])
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    // Stash the pending signup alongside the OTP. The password is stored hashed
    // and the whole record self-destructs via the TTL index after it expires.
    await OtpRecord.create({
      email: emailNorm,
      otp: hashedOtp,
      expiresAt,
      fullName: fullName.trim(),
      passwordHash,
      phone: phone || undefined,
    })

    await sendOtpEmail({ to: emailNorm, otp })

    return Response.json({
      success: true,
      message: 'Verification code sent. Please verify your email to finish signing up.',
    })
  } catch (err) {
    console.error('[signup]', err)
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}
