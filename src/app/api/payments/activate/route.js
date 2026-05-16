import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import Payment from '@/models/Payment'
import Notification from '@/models/Notification'
import dodoClient from '@/lib/dodo'

// Called when user returns from Dodo checkout with ?payment=return.
// Verifies the actual payment status via Dodo's API before activating — Dodo's
// return_url fires for both success and failure, so we never trust the URL alone.
// The webhook remains an idempotent confirmation.
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

    // Already paid/verified — nothing to do
    if (user.verificationTier === 'paid' || user.verificationTier === 'verified' || user.verificationTier === 'trusted') {
      return NextResponse.json({ success: true, verificationTier: user.verificationTier, onboardingCompleted: user.onboardingCompleted ?? false })
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

    // For pending payments, verify with Dodo that the checkout actually succeeded.
    // Dodo's return_url fires for both success AND failure, so we cannot trust the
    // URL param alone — we must confirm the payment_status via the API.
    if (payment.status === 'pending') {
      if (!payment.dodoPaymentLinkId) {
        return NextResponse.json(
          { success: false, error: 'Payment verification failed. Please contact support.' },
          { status: 400 }
        )
      }
      try {
        const session = await dodoClient.checkoutSessions.retrieve(payment.dodoPaymentLinkId)
        if (session.payment_status !== 'succeeded') {
          const status = session.payment_status
          let msg
          let processing = false
          if (status === 'failed' || status === 'requires_payment_method') {
            msg = 'Your payment could not be processed. Please try again.'
          } else if (status === 'cancelled') {
            msg = 'Payment was cancelled. You can try again below.'
          } else if (status === 'processing') {
            msg = 'Your payment is still being processed. Please wait a moment, then try again.'
            processing = true
          } else if (status == null) {
            msg = 'No payment was completed for this session. Please try again.'
          } else {
            // requires_customer_action, requires_merchant_action, requires_confirmation,
            // requires_capture, partially_captured, partially_captured_and_capturable
            msg = 'Payment is not complete. Please try again.'
          }
          // Mark the record failed so the create route never reuses this dead session URL.
          // Only skip this for `processing` — that session may still succeed via webhook.
          if (!processing) {
            await Payment.findByIdAndUpdate(payment._id, { $set: { status: 'failed' } })
          }
          return NextResponse.json({ success: false, error: msg, processing }, { status: 400 })
        }
      } catch (err) {
        console.error('Dodo session verify error:', err)
        return NextResponse.json(
          { success: false, error: 'Could not verify payment with provider. Please contact support.' },
          { status: 400 }
        )
      }
    }

    // Set tier to 'paid' — user enters the app under admin review
    await User.findByIdAndUpdate(userId, { $set: { verificationTier: 'paid' } })

    // Mark payment completed if it was still pending (webhook may arrive later)
    if (payment.status === 'pending') {
      await Payment.findByIdAndUpdate(payment._id, {
        $set: { status: 'completed', paidAt: new Date() },
      })
    }

    // Notify user (skip if one already exists for this event)
    const existing = await Notification.findOne({
      recipientId: userId,
      type: 'verification_under_review',
      title: 'Payment received — verification in progress',
    })
    if (!existing) {
      await Notification.create({
        recipientId: userId,
        type: 'verification_under_review',
        title: 'Payment received — verification in progress',
        body: 'Your payment was successful. Our team will review your documents within 24–48 hours.',
        link: '/profile/verification',
        isRead: false,
      })
    }

    return NextResponse.json({ success: true, verificationTier: 'paid', onboardingCompleted: user.onboardingCompleted ?? false })
  } catch (error) {
    console.error('Payment activate error:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
