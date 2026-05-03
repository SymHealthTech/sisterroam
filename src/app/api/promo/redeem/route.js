import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import Payment from '@/models/Payment'
import PromoCode from '@/models/PromoCode'
import VerificationRequest from '@/models/VerificationRequest'
import Notification from '@/models/Notification'
import { sendVerificationBadgeEmail } from '@/lib/resend'

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

    if (user.verificationTier === 'verified' || user.verificationTier === 'trusted') {
      return NextResponse.json({ success: true, verificationTier: user.verificationTier })
    }

    // KYC must be approved before badge can be activated
    const verif = await VerificationRequest.findOne({ userId, status: 'approved' })
    if (!verif) {
      return NextResponse.json({ success: false, error: 'KYC not approved' }, { status: 400 })
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

    // Activate badge
    await User.findByIdAndUpdate(userId, { $set: { verificationTier: 'verified' } })

    // Notify (skip if duplicate)
    const existing = await Notification.findOne({
      recipientId: userId,
      type: 'verification_approved',
      title: 'Your verified badge is now active!',
    })
    if (!existing) {
      await Notification.create({
        recipientId: userId,
        type: 'verification_approved',
        title: 'Your verified badge is now active!',
        body: 'Your promo code was applied. You can now send and receive hosting requests.',
        link: '/profile/verification',
        isRead: false,
      })
      sendVerificationBadgeEmail(user).catch(console.error)
    }

    return NextResponse.json({ success: true, verificationTier: 'verified' })
  } catch (error) {
    console.error('Promo redeem error:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
