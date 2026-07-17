import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^\+[1-9]\d{6,14}$/

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
    const existing = await User.findOne({ email: emailNorm }).select('+password')

    // A fully verified account already owns this email — genuine conflict.
    if (existing && existing.emailVerified) {
      return Response.json({ error: 'Email already registered' }, { status: 409 })
    }

    // Phone must be unique — but ignore the unverified same-email row we're about
    // to reclaim, otherwise re-signing-up with the same phone would false-conflict.
    if (phone) {
      const phoneOwner = await User.findOne({ phone }, '_id').lean()
      if (phoneOwner && (!existing || phoneOwner._id.toString() !== existing._id.toString())) {
        return Response.json({ error: 'Phone already registered' }, { status: 409 })
      }
    }

    let user
    if (existing) {
      // Reclaim the half-created (pre-OTP, unverified) account: refresh the details
      // and require a fresh OTP. The code goes to the email owner, so this is safe
      // and prevents an abandoned signup from permanently locking the email out.
      existing.fullName = fullName.trim()
      existing.password = password // pre('save') re-hashes (password is now modified)
      existing.phone = phone
      existing.emailVerified = false
      user = await existing.save()
    } else {
      // Pass plain password — the User model's pre('save') hook hashes it
      user = new User({
        fullName: fullName.trim(),
        email: emailNorm,
        password,
        phone,
        emailVerified: false,
        phoneVerified: false,
      })
      await user.save()
    }

    return Response.json(
      {
        success: true,
        userId: user._id.toString(),
        message: 'Account created. Please verify your email.',
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('[signup]', err)
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}
