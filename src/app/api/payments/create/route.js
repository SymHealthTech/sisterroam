import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import Payment from '@/models/Payment'
import { createPaymentLink } from '@/lib/dodo'

export async function POST(request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    await connectDB()

    const { currency = 'INR' } = await request.json()

    if (!['INR', 'USD'].includes(currency)) {
      return NextResponse.json(
        { success: false, error: 'Invalid currency' },
        { status: 400 }
      )
    }

    const userId = session.user.id

    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    if (user.verificationTier !== 'basic') {
      return NextResponse.json(
        { success: false, error: 'Already verified' },
        { status: 400 }
      )
    }

    const existingCompleted = await Payment.findOne({
      userId,
      purpose: 'verified_badge',
      status: 'completed',
    })

    if (existingCompleted) {
      return NextResponse.json(
        { success: false, error: 'Verified badge already purchased' },
        { status: 400 }
      )
    }

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
    const recentPending = await Payment.findOne({
      userId,
      purpose: 'verified_badge',
      status: 'pending',
      createdAt: { $gte: tenMinutesAgo },
    })

    if (recentPending?.dodoPaymentLinkId) {
      const paymentUrl = `https://checkout.dodopayments.com/${recentPending.dodoPaymentLinkId}`
      return NextResponse.json({ success: true, paymentUrl, reused: true })
    }

    const { paymentUrl, paymentId } = await createPaymentLink(
      userId.toString(),
      user.email,
      user.fullName,
      currency
    )

    const amount = currency === 'INR' ? 199 : 5

    await Payment.create({
      userId,
      dodoPaymentLinkId: paymentId,
      amount,
      currency,
      purpose: 'verified_badge',
      status: 'pending',
      ipAddress: request.headers.get('x-forwarded-for') || '',
      userAgent: request.headers.get('user-agent') || '',
    })

    return NextResponse.json({ success: true, paymentUrl })

  } catch (error) {
    console.error('Payment create error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create payment' },
      { status: 500 }
    )
  }
}
