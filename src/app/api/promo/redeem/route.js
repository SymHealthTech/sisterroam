import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import Payment from '@/models/Payment'
import PromoCode from '@/models/PromoCode'
import Notification from '@/models/Notification'

export async function POST(req) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    const { code } = await req.json()
    if (!code?.trim()) {
      return NextResponse.json({ success: false, error: 'Promo code required' }, { status: 400 })
    }

    await connectDB()
    const userId = session.user.id

    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    if (user.verificationTier === 'paid' || user.verificationTier === 'verified' || user.verificationTier === 'trusted') {
      return NextResponse.json({ success: true, verificationTier: user.verificationTier })
    }

    // Atomically claim one use of the promo code
    const promo = await PromoCode.findOneAndUpdate(
      {
        code: code.trim().toUpperCase(),
        isActive: true,
        $expr: { $lt: ['$usedCount', '$maxUses'] },
      },
      {
        $inc: { usedCount: 1 },
        $push: {
          usedBy: {
            userId,
            userName: user.fullName,
            userEmail: user.email,
            usedAt: new Date(),
          },
        },
      },
      { new: true },
    )

    if (!promo) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired promo code' },
        { status: 400 },
      )
    }

    // Create a ₹0 / $0 payment record so the admin can see promo redemptions
    await Payment.create({
      userId,
      amount: 0,
      currency: user.country === 'India' ? 'INR' : 'USD',
      purpose: 'verified_badge',
      status: 'completed',
      promoCode: code.trim().toUpperCase(),
      paidAt: new Date(),
    })

    // Set tier to 'paid' — user enters the app under admin review
    await User.findByIdAndUpdate(userId, { $set: { verificationTier: 'paid' } })

    await Notification.create({
      recipientId: userId,
      type: 'verification_approved',
      title: 'Verification fee waived!',
      body: 'Your promo code was applied. Your documents are under review — you\'ll be notified once approved.',
      link: '/feed',
      isRead: false,
    }).catch(console.error)

    return NextResponse.json({ success: true, verificationTier: 'paid' })
  } catch (error) {
    console.error('Promo redeem error:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
