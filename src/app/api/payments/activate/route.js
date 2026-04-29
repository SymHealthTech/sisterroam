import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import Payment from '@/models/Payment'
import VerificationRequest from '@/models/VerificationRequest'
import Notification from '@/models/Notification'
import { sendVerificationBadgeEmail } from '@/lib/resend'

// Called immediately when user returns from Dodo payment with ?payment=success.
// Activates the badge without waiting for the webhook — the webhook remains an
// idempotent confirmation. Guards: KYC must be approved + a payment record must
// exist (pending or completed) for this user.
export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    await connectDB()
    const userId = session.user.id

    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Already verified — nothing to do
    if (user.verificationTier === 'verified' || user.verificationTier === 'trusted') {
      return NextResponse.json({ success: true, verificationTier: user.verificationTier })
    }

    // KYC must be approved before the badge can be activated
    const verif = await VerificationRequest.findOne({ userId, status: 'approved' })
    if (!verif) {
      return NextResponse.json(
        { success: false, error: 'KYC not approved' },
        { status: 400 }
      )
    }

    // A payment record (pending or completed) must exist — proves the user
    // actually went through the checkout flow
    const payment = await Payment.findOne({
      userId,
      purpose: 'verified_badge',
      status: { $in: ['pending', 'completed'] },
    }).sort({ createdAt: -1 })

    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'No payment record found' },
        { status: 400 }
      )
    }

    // Activate badge in DB
    await User.findByIdAndUpdate(userId, { $set: { verificationTier: 'verified' } })

    // Mark payment completed if it was still pending (webhook may arrive later)
    if (payment.status === 'pending') {
      await Payment.findByIdAndUpdate(payment._id, {
        $set: { status: 'completed', paidAt: new Date() },
      })
    }

    // Notify user (skip if one already exists for this event)
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
        body: 'Your payment was successful. You can now send and receive hosting requests.',
        link: '/profile/verification',
        isRead: false,
      })
      sendVerificationBadgeEmail(user).catch(console.error)
    }

    return NextResponse.json({ success: true, verificationTier: 'verified' })
  } catch (error) {
    console.error('Payment activate error:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
