import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import Payment from '@/models/Payment'
import dodoClient, { createCheckoutSession } from '@/lib/dodo'

export async function POST(request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    await connectDB()

    const { currency = 'INR' } = await request.json()
    if (!['INR', 'USD'].includes(currency)) {
      return NextResponse.json({ success: false, error: 'Invalid currency' }, { status: 400 })
    }

    const userId = session.user.id
    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Block if already paid/verified
    if (user.verificationTier === 'paid' || user.verificationTier === 'verified' || user.verificationTier === 'trusted') {
      return NextResponse.json({ success: false, error: 'Already activated' }, { status: 400 })
    }

    // Block double payment
    const existingCompleted = await Payment.findOne({ userId, purpose: 'verified_badge', status: 'completed' })
    if (existingCompleted) {
      return NextResponse.json({ success: false, error: 'Verification fee already paid' }, { status: 400 })
    }

    // Reuse a session only within a 2-minute window (double-click protection).
    // Shorter than Dodo's session TTL, so the URL is guaranteed fresh.
    // Anything older gets a brand-new checkout to avoid serving stale/expired URLs.
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000)
    const recentPending = await Payment.findOne({
      userId,
      purpose: 'verified_badge',
      status: 'pending',
      createdAt: { $gte: twoMinutesAgo },
    })

    if (recentPending?.checkoutUrl && recentPending.dodoPaymentLinkId) {
      try {
        const dodoSession = await dodoClient.checkoutSessions.retrieve(recentPending.dodoPaymentLinkId)
        const isTerminal = ['failed', 'cancelled', 'succeeded', 'requires_payment_method'].includes(dodoSession.payment_status)
        if (!isTerminal) {
          return NextResponse.json({ success: true, paymentUrl: recentPending.checkoutUrl, reused: true })
        }
        // Session reached a terminal state — update our record and fall through to a fresh session
        const finalStatus = dodoSession.payment_status === 'succeeded' ? 'completed' : 'failed'
        await Payment.findByIdAndUpdate(recentPending._id, { $set: { status: finalStatus } })
      } catch {
        // Dodo verify failed — fall through to create a fresh session
      }
    }

    const proto = request.headers.get('x-forwarded-proto') || 'https'
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || ''
    const returnBase = process.env.NEXTAUTH_URL || (host ? `${proto}://${host}` : '')

    const { checkoutUrl, sessionId } = await createCheckoutSession(
      userId.toString(),
      user.email,
      user.fullName,
      currency,
      returnBase
    )

    const amount = currency === 'INR' ? 199 : 5

    await Payment.create({
      userId,
      dodoPaymentLinkId: sessionId,
      checkoutUrl,
      amount,
      currency,
      purpose: 'verified_badge',
      status: 'pending',
      ipAddress: request.headers.get('x-forwarded-for') || '',
      userAgent: request.headers.get('user-agent') || '',
    })

    return NextResponse.json({ success: true, paymentUrl: checkoutUrl })

  } catch (error) {
    console.error('Payment create error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create payment' }, { status: 500 })
  }
}
