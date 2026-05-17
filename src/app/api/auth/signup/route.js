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

    // Run both uniqueness checks in parallel to save one DB round-trip
    const [emailExists, phoneExists] = await Promise.all([
      User.findOne({ email: email.toLowerCase().trim() }, '_id').lean(),
      phone ? User.findOne({ phone }, '_id').lean() : null,
    ])
    if (emailExists) return Response.json({ error: 'Email already registered' }, { status: 409 })
    if (phoneExists) return Response.json({ error: 'Phone already registered' }, { status: 409 })

    // Pass plain password — the User model's pre('save') hook hashes it
    const user = new User({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone,
      emailVerified: false,
      phoneVerified: false,
    })

    await user.save()

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
