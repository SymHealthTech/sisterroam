import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import Payment from '@/models/Payment'
import Notification from '@/models/Notification'
import { verifyWebhookSignature } from '@/lib/dodo'
import { sendVerificationBadgeEmail } from '@/lib/resend'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  let rawBody = ''

  try {
    rawBody = await request.text()

    const signature =
      request.headers.get('webhook-signature') ||
      request.headers.get('dodo-signature') ||
      request.headers.get('x-dodo-signature') || ''

    if (signature) {
      const isValid = verifyWebhookSignature(rawBody, signature)
      if (!isValid) {
        console.error('Webhook signature verification failed')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const event = JSON.parse(rawBody)

    console.log('Dodo webhook received:', event.type, JSON.stringify(event.data?.metadata || {}))

    await connectDB()

    if (event.type === 'payment.succeeded') {
      const { payment_id, metadata, total_amount, currency } = event.data || {}
      const userId = metadata?.userId

      if (!userId) {
        console.error('No userId in webhook metadata')
        return NextResponse.json({ received: true })
      }

      await Payment.findOneAndUpdate(
        {
          $or: [
            { dodoPaymentId: payment_id },
            { userId, status: 'pending' },
          ],
        },
        {
          $set: {
            status: 'completed',
            dodoPaymentId: payment_id,
            paidAt: new Date(),
            webhookPayload: event.data,
            amount: total_amount / 100,
          },
        },
        { new: true }
      )

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: { verificationTier: 'verified' } },
        { new: true }
      )

      if (user) {
        await Notification.create({
          recipientId: userId,
          type: 'verification_approved',
          title: 'Your verified badge is now active!',
          body: 'Your payment was successful. You can now send and receive hosting requests.',
          link: '/profile/verification',
          isRead: false,
        })

        try {
          await sendVerificationBadgeEmail(user)
        } catch (emailError) {
          console.error('Badge email failed:', emailError)
        }
      }

      console.log(`Payment succeeded for user ${userId}`)
    }

    if (event.type === 'payment.failed') {
      const { payment_id, metadata } = event.data || {}
      const userId = metadata?.userId

      await Payment.findOneAndUpdate(
        {
          $or: [
            { dodoPaymentId: payment_id },
            { userId, status: 'pending' },
          ],
        },
        {
          $set: {
            status: 'failed',
            dodoPaymentId: payment_id,
            webhookPayload: event.data,
          },
        }
      )

      if (userId) {
        await Notification.create({
          recipientId: userId,
          type: 'verification_rejected',
          title: 'Payment could not be processed',
          body: 'Your payment failed. Please try again or contact support.',
          link: '/profile/verification',
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
