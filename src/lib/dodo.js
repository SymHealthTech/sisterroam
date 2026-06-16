import DodoPayments from 'dodopayments'

const dodoClient = new DodoPayments({
  bearerToken: process.env.DODO_SECRET_KEY,
  webhookKey:  process.env.DODO_WEBHOOK_SECRET,
  environment: process.env.NODE_ENV === 'production' ? 'live_mode' : 'test_mode',
})

export default dodoClient

// isDiscount=true uses DODO_PRODUCT_ID_{currency}_DISCOUNT env vars (₹199/INR or $5/USD).
// isDiscount=false uses DODO_PRODUCT_ID_{currency} env vars (₹299/INR or $7/USD).
export async function createCheckoutSession(userId, userEmail, userName, currency, returnBase, isDiscount = false) {
  const envKey = isDiscount
    ? `DODO_PRODUCT_ID_${currency}_DISCOUNT`
    : `DODO_PRODUCT_ID_${currency}`
  const productId = process.env[envKey]

  if (!productId) {
    throw new Error(`Missing ${envKey} environment variable`)
  }

  const base = returnBase || process.env.NEXTAUTH_URL
  if (!base) {
    throw new Error('Missing NEXTAUTH_URL environment variable')
  }

  const response = await dodoClient.checkoutSessions.create({
    product_cart: [{ product_id: productId, quantity: 1 }],
    customer: {
      email: userEmail,
      name:  userName,
    },
    billing_currency: currency,
    billing_address: currency === 'INR' ? { country: 'IN' } : undefined,
    metadata: {
      userId:    userId.toString(),
      purpose:   'verified_badge',
      currency,
      isDiscount: isDiscount ? 'true' : 'false',
    },
    return_url: `${base}/onboarding/verify?payment=return`,
    cancel_url: `${base}/onboarding/verify?payment=cancelled`,
  })

  const checkoutUrl = response.checkout_url
  if (!checkoutUrl) {
    throw new Error('Dodo did not return a checkout URL')
  }

  return {
    checkoutUrl,
    sessionId: response.session_id,
  }
}

// Use the Dodo SDK's built-in standardwebhooks verification.
// Headers must include webhook-id, webhook-timestamp, webhook-signature.
export function parseWebhookEvent(rawBody, headers) {
  // unwrap throws if signature is invalid; returns parsed event object
  return dodoClient.webhooks.unwrap(rawBody, { headers })
}
