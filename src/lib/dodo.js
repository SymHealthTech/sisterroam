import DodoPayments from 'dodopayments'
import crypto from 'crypto'

const dodoClient = new DodoPayments({
  bearerToken: process.env.DODO_SECRET_KEY,
})

export default dodoClient

export async function createPaymentLink(userId, userEmail, userName, currency) {
  const productId = currency === 'INR'
    ? process.env.DODO_PRODUCT_ID_INR
    : process.env.DODO_PRODUCT_ID_USD

  const response = await dodoClient.payments.create({
    billing: {
      city: 'Mumbai',
      country: currency === 'INR' ? 'IN' : 'US',
      state: 'MH',
      street: null,
      zipcode: '400001',
    },
    customer: {
      email: userEmail,
      name: userName,
      create_new_customer: true,
    },
    metadata: {
      userId: userId.toString(),
      purpose: 'verified_badge',
      currency,
    },
    payment_link: true,
    product_cart: [{ product_id: productId, quantity: 1 }],
    return_url: process.env.NEXTAUTH_URL + '/profile/verification?payment=success',
    tax_id: null,
  })

  return { paymentUrl: response.payment_link, paymentId: response.payment_id }
}

export function verifyWebhookSignature(payload, signature) {
  try {
    const hmac = crypto.createHmac('sha256', process.env.DODO_WEBHOOK_SECRET)
    hmac.update(payload, 'utf8')
    const computedSignature = hmac.digest('hex')
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(computedSignature, 'hex')
    )
  } catch {
    return false
  }
}
