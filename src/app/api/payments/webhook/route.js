import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import Payment from '@/models/Payment'
import PromoCode from '@/models/PromoCode'
import Notification from '@/models/Notification'
import { parseWebhookEvent } from '@/lib/dodo'

export const dynamic = 'force-dynamic'

const PAID_TITLE = 'Payment received — verification in progress'

// Find the Payment row a Dodo event belongs to. Prefers the exact Dodo payment
// id; otherwise the user's most recent verified_badge checkout that has no Dodo
// id yet (pending, or already marked completed/failed by /api/payments/activate).
async function findPaymentForEvent(userId, paymentId, statuses) {
  if (paymentId) {
    const exact = await Payment.findOne({ dodoPaymentId: paymentId })
    if (exact) return exact
  }
  if (!userId) return null
  return Payment.findOne({
    userId,
    purpose: 'verified_badge',
    status: { $in: statuses },
    dodoPaymentId: { $exists: false },
    promoCode: { $exists: false },
  }).sort({ createdAt: -1 })
}

export async function POST(request) {
  let rawBody = ''

  try {
    rawBody = await request.text()

    // The standardwebhooks library needs these three headers from Dodo
    const webhookHeaders = {
      'webhook-id':        request.headers.get('webhook-id') || '',
      'webhook-timestamp': request.headers.get('webhook-timestamp') || '',
      'webhook-signature': request.headers.get('webhook-signature') || '',
    }

    let event
    try {
      event = parseWebhookEvent(rawBody, webhookHeaders)
    } catch (sigErr) {
      console.error('Webhook signature invalid:', sigErr.message)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    console.log('Dodo webhook:', event.type, JSON.stringify(event.data?.metadata || {}))

    // Only verification-fee checkouts are handled here.
    const purpose = event.data?.metadata?.purpose
    if (purpose && purpose !== 'verified_badge') {
      console.log(`Dodo webhook ignored: purpose=${purpose}`)
      return NextResponse.json({ received: true })
    }

    await connectDB()

    if (event.type === 'payment.succeeded') {
      const { payment_id, metadata, total_amount } = event.data || {}
      const userId = metadata?.userId

      if (!userId || !mongoose.isValidObjectId(userId)) {
        console.error('No valid userId in webhook metadata')
        return NextResponse.json({ received: true })
      }

      const payment = await findPaymentForEvent(userId, payment_id, ['pending', 'completed', 'failed'])
      // Dodo retries deliveries — a payment we already recorded is a no-op.
      const alreadyRecorded = payment?.dodoPaymentId === payment_id && payment?.status === 'completed'

      const update = {
        status:         'completed',
        dodoPaymentId:  payment_id,
        paidAt:         payment?.paidAt ?? new Date(),
        webhookPayload: event.data,
        // total_amount from Dodo is in smallest currency unit (paise / cents)
        ...(typeof total_amount === 'number' ? { amount: total_amount / 100 } : {}),
      }
      let completedPayment
      if (payment) {
        completedPayment = await Payment.findByIdAndUpdate(payment._id, { $set: update }, { new: true })
      } else {
        // A real (signature-verified) payment with no matching checkout row —
        // record it anyway so no paid member goes unaccounted for.
        completedPayment = await Payment.create({
          userId,
          purpose:  'verified_badge',
          currency: event.data?.currency === 'INR' ? 'INR' : 'USD',
          ...update,
          amount:   update.amount ?? 5,
        })
      }

      // basic → paid only. Never touch a member who is already paid, verified or
      // trusted — a late/retried webhook used to downgrade verified members.
      await User.updateOne(
        { _id: userId, verificationTier: 'basic' },
        { $set: { verificationTier: 'paid' } },
      )
      const user = await User.findById(userId).select('fullName email').lean()

      // Record promo code usage for discount payments (type='discount' codes)
      if (!alreadyRecorded && completedPayment?.promoCode && user) {
        await PromoCode.findOneAndUpdate(
          { code: completedPayment.promoCode, isActive: true, type: 'discount' },
          {
            $inc: { usedCount: 1 },
            $push: {
              usedBy: {
                userId,
                userName:  user.fullName,
                userEmail: user.email,
                usedAt:    new Date(),
              },
            },
          }
        ).catch((err) => console.error('PromoCode usage record error:', err))
      }

      // /api/payments/activate creates the same notification — only one per member.
      if (user) {
        const existing = await Notification.findOne({
          recipientId: userId,
          type:        'verification_under_review',
          title:       PAID_TITLE,
        }).lean()
        if (!existing) {
          await Notification.create({
            recipientId: userId,
            type:        'verification_under_review',
            title:       PAID_TITLE,
            body:        'Your payment was successful. Our team will review your documents within 24–48 hours.',
            link:        '/feed',
            isRead:      false,
          })
        }
      }

      console.log(`Payment succeeded for user ${userId}${alreadyRecorded ? ' (duplicate delivery)' : ''}`)
    }

    if (event.type === 'payment.failed') {
      const { payment_id, metadata } = event.data || {}
      const userId = mongoose.isValidObjectId(metadata?.userId) ? metadata.userId : null

      const payment = await findPaymentForEvent(userId, payment_id, ['pending'])
      // Only a pending checkout flips to failed — never one that already succeeded.
      // The Dodo id is not stamped on it, so a successful retry in the same
      // checkout still matches this row (see findPaymentForEvent).
      const markedFailed = payment?.status === 'pending'
      if (markedFailed) {
        await Payment.findByIdAndUpdate(payment._id, {
          $set: { status: 'failed', webhookPayload: event.data },
        })
      }

      if (userId && markedFailed) {
        const user = await User.findById(userId).select('verificationTier').lean()
        // Don't alarm a member whose fee is already settled (e.g. a retry succeeded).
        if (user?.verificationTier === 'basic') {
          await Notification.create({
            recipientId: userId,
            type:        'verification_rejected',
            title:       'Payment could not be processed',
            body:        'Your payment failed. Please try again or contact support.',
            link:        '/onboarding/verify',
          })
        }
      }

      console.log(`Payment failed for user ${userId}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    // Return 5xx so Dodo retries — every step above is safe to repeat.
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Processing error' }, { status: 500 })
  }
}
