import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import { sendPasswordResetEmail } from '@/lib/resend'

export async function POST(request) {
  try {
    const body = await request.json()
    const email = body?.email?.toLowerCase?.().trim()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    await connectDB()

    const rawToken = crypto.randomBytes(32).toString('hex')
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex')
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // findOneAndUpdate returns null if user not found — we still return 200
    // to prevent email enumeration attacks
    const user = await User.findOneAndUpdate(
      { email },
      { passwordResetToken: hashedToken, passwordResetExpires: expires },
      { new: false },
    )

    if (user) {
      const resetUrl = `${process.env.NEXTAUTH_URL ?? 'https://sisterroam.com'}/reset-password?token=${rawToken}`
      await sendPasswordResetEmail({ to: email, name: user.fullName, resetUrl })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[forgot-password]', e)
    return NextResponse.json(
      { error: 'Failed to send reset email. Please try again.' },
      { status: 500 },
    )
  }
}
