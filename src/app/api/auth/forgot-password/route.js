import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import { sendPasswordResetEmail } from '@/lib/resend'
import { checkRateLimit } from '@/lib/rateLimit'

export async function POST(request) {
  try {
    const body = await request.json()
    const email = body?.email?.toLowerCase?.().trim()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    await connectDB()

    // At most 3 reset emails per address per hour (stops inbox flooding). Still
    // answer 200 so the response never reveals whether the account exists.
    const limit = await checkRateLimit(`reset:${email}`, { max: 3, windowMs: 60 * 60 * 1000 })
    if (!limit.allowed) return NextResponse.json({ success: true })

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
