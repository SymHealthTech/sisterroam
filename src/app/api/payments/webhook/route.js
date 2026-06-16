import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import Payment from '@/models/Payment'
import PromoCode from '@/models/PromoCode'
import Notification from '@/models/Notification'
import { parseWebhookEvent } from '@/lib/dodo'

export const dynamic = 'force-dynamic'

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

    await connectDB()

    if (event.type === 'payment.succeeded') {
      const { payment_id, metadata, total_amount } = event.data || {}
      const userId = metadata?.userId

      if (!userId) {
        console.error('No userId in webhook metadata')
        return NextResponse.json({ received: true })
      }

      const completedPayment = await Payment.findOneAndUpdate(
        { $or: [{ dodoPaymentId: payment_id }, { userId, status: 'pending' }] },
        {
          $set: {
            status:         'completed',
            dodoPaymentId:  payment_id,
            paidAt:         new Date(),
            webhookPayload: event.data,
            // total_amount from Dodo is in smallest currency unit (paise / cents)
            amount:         total_amount / 100,
          },
        },
        { new: true }
      )

      // Set to 'paid' — user enters the app under admin review
      const user = await User.findByIdAndUpdate(
        userId,
        { $set: { verificationTier: 'paid' } },
        { new: true }
      )

      // Record promo code usage for discount payments (type='discount' codes)
      if (completedPayment?.promoCode && user) {
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

      if (user) {
        await Notification.create({
          recipientId: userId,
          type:        'verification_approved',
          title:       'Payment received — verification in progress',
          body:        'Your payment was successful. Our team will review your documents within 24–48 hours.',
          link:        '/feed',
          isRead:      false,
        })
      }

      console.log(`Payment succeeded for user ${userId}`)
    }

    if (event.type === 'payment.failed') {
      const { payment_id, metadata } = event.data || {}
      const userId = metadata?.userId

      await Payment.findOneAndUpdate(
        { $or: [{ dodoPaymentId: payment_id }, { userId, status: 'pending' }] },
        { $set: { status: 'failed', dodoPaymentId: payment_id, webhookPayload: event.data } }
      )

      if (userId) {
        await Notification.create({
          recipientId: userId,
          type:        'verification_rejected',
          title:       'Payment could not be processed',
          body:        'Your payment failed. Please try again or contact support.',
          link:        '/verify',
        })
      }

      console.log(`Payment failed for user ${userId}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ received: true })
  }
}
