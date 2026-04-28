import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import Payment from '@/models/Payment'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ status: 'none' })
    }

    await connectDB()

    const payment = await Payment.findOne({
      userId: session.user.id,
      purpose: 'verified_badge',
    }).sort({ createdAt: -1 })

    if (!payment) {
      return NextResponse.json({ status: 'none' })
    }

    return NextResponse.json({
      status: payment.status,
      currency: payment.currency,
      amount: payment.amount,
      paidAt: payment.paidAt,
    })

  } catch (error) {
    console.error('Payment status error:', error)
    return NextResponse.json({ status: 'none' })
  }
}
