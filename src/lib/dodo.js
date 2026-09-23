import DodoPayments from 'dodopayments'

// Which Dodo API to talk to. DODO_ENV ('live_mode' | 'test_mode') wins when set.
// Otherwise production is live, and Vercel preview deployments are forced to
// test mode — they also run with NODE_ENV=production and must never charge real
// cards. DODO_BASE_URL points at a local mock and is only used by the e2e tests.
function dodoTarget() {
  if (process.env.DODO_BASE_URL) return { baseURL: process.env.DODO_BASE_URL }
  if (process.env.DODO_ENV === 'live_mode' || process.env.DODO_ENV === 'test_mode') {
    return { environment: process.env.DODO_ENV }
  }
  if (process.env.VERCEL_ENV === 'preview') return { environment: 'test_mode' }
  return { environment: process.env.NODE_ENV === 'production' ? 'live_mode' : 'test_mode' }
}

const dodoClient = new DodoPayments({
  bearerToken: process.env.DODO_SECRET_KEY,
  webhookKey:  process.env.DODO_WEBHOOK_SECRET,
  ...dodoTarget(),
})

export default dodoClient

// Single flat product: $5 USD for everyone. Set DODO_PRODUCT_ID_USD.
export async function createCheckoutSession(userId, userEmail, userName, returnBase) {
  const productId = process.env.DODO_PRODUCT_ID_USD

  if (!productId) {
    throw new Error('Missing DODO_PRODUCT_ID_USD environment variable')
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
    billing_currency: 'USD',
    metadata: {
      userId:  userId.toString(),
      purpose: 'verified_badge',
      currency: 'USD',
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
