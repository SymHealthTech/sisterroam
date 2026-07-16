import { sendGAEvent } from '@next/third-parties/google'

/**
 * Thin wrappers around Google Analytics 4 event tracking.
 *
 * PRIVACY: SisterRoam is a safety-critical app for solo female travellers.
 * NEVER pass location data, user IDs, names, emails, or any other
 * identifying information as event parameters. Keep parameters limited to
 * non-identifying context (page path, event metadata like tier/amount/code).
 *
 * All helpers are safe to call on the server or before GA has loaded —
 * sendGAEvent only runs in the browser once the <GoogleAnalytics> tag mounts.
 */

/** Verified-badge purchase confirmed. `tier` is a non-identifying badge tier label. */
export function trackBadgePurchase(tier) {
  sendGAEvent('event', 'purchase_verified_badge', {
    value: 5,
    currency: 'USD',
    badge_tier: tier,
  })
}

/** SOS button activated. Records only the page path — no coordinates. */
export function trackSOSTriggered() {
  sendGAEvent('event', 'sos_button_triggered', {
    page: typeof window !== 'undefined' ? window.location.pathname : '',
  })
}

/** User confirmed they need help after the SOS alert was sent. */
export function trackSOSConfirmed() {
  sendGAEvent('event', 'sos_confirmed')
}

/** New account signup completed. */
export function trackSignupCompleted() {
  sendGAEvent('event', 'signup_completed')
}

/** A promo code was successfully applied. `code` is a marketing code, not PII. */
export function trackPromoCodeApplied(code) {
  sendGAEvent('event', 'promo_code_applied', {
    promo_code: code,
  })
}
