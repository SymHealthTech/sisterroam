/**
 * Runtime feature flags.
 *
 * VERIFICATION_UPLOADS_ON_HOLD
 * ----------------------------
 * Kill-switch for identity-verification media uploads (ID photos + intro video).
 * When `true`:
 *   - the server refuses to sign any Cloudinary upload to the
 *     `sisterroam/verifications` folder tree (hard block — cannot be bypassed by
 *     calling the API directly), and
 *   - the /onboarding/verify page shows an "on hold" notice instead of the
 *     upload steps.
 *
 * This was turned on after a fake account uploaded disallowed content to the
 * verification video folder, putting the Cloudinary account under review.
 *
 * To RESUME verification once the pipeline is hardened (moderation + server
 * proxy), flip this single constant to `false`. It is imported by both the
 * client page and the server route, so one edit covers both layers.
 */
export const VERIFICATION_UPLOADS_ON_HOLD = true
