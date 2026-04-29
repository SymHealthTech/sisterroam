import DodoPayments from 'dodopayments'

const dodoClient = new DodoPayments({
  bearerToken: process.env.DODO_SECRET_KEY,
  webhookKey:  process.env.DODO_WEBHOOK_SECRET,
  environment: 'test_mode',
})

export default dodoClient

export async function createCheckoutSession(userId, userEmail, userName, currency) {
  const productId = currency === 'INR'
    ? process.env.DODO_PRODUCT_ID_INR
    : process.env.DODO_PRODUCT_ID_USD

  const returnBase = process.env.NEXTAUTH_URL

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
    return_url: `${returnBase}/profile/verification?payment=success`,
    cancel_url: `${returnBase}/profile/verification?payment=cancelled`,
  })

  // response shape: { session_id, checkout_url }
  return {
    checkoutUrl: response.checkout_url,
    sessionId:   response.session_id,
  }
}

// Use the Dodo SDK's built-in standardwebhooks verification.
// Headers must include webhook-id, webhook-timestamp, webhook-signature.
export function parseWebhookEvent(rawBody, headers) {
  // unwrap throws if signature is invalid; returns parsed event object
  return dodoClient.webhooks.unwrap(rawBody, { headers })
}
