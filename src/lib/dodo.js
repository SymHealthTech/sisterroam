import DodoPayments from 'dodopayments'

const dodoClient = new DodoPayments({
  bearerToken: process.env.DODO_SECRET_KEY,
  webhookKey:  process.env.DODO_WEBHOOK_SECRET,
  environment: 'test_mode',
})

export default dodoClient

export async function createCheckoutSession(userId, userEmail, userName, currency, returnBase) {
  const productId = currency === 'INR'
    ? process.env.DODO_PRODUCT_ID_INR
    : process.env.DODO_PRODUCT_ID_USD

  if (!productId) {
    throw new Error(`Missing DODO_PRODUCT_ID_${currency} environment variable`)
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
    metadata: {
      userId:  userId.toString(),
      purpose: 'verified_badge',
      currency,
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
