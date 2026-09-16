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

/**
 * PROFILE_PHOTO_UPLOADS_ON_HOLD
 * -----------------------------
 * Kill-switch for profile-photo uploads. Profile photos are public (shown as
 * avatars everywhere) and were open to any logged-in member with no moderation —
 * a misuse vector. Held while the Cloudinary account is under review.
 * When `true`:
 *   - the server refuses to sign / accept uploads to `sisterroam/profiles`
 *     (folder) or the `profile_photo` type, and
 *   - the profile-photo picker is disabled with an "unavailable" note; members
 *     fall back to their initials avatar.
 *
 * RESUME once Cloudinary moderation is in place: flip to `false`.
 */
export const PROFILE_PHOTO_UPLOADS_ON_HOLD = true

/**
 * SAFETY_EVIDENCE_UPLOADS_ON_HOLD
 * -------------------------------
 * Kill-switch for safety-report evidence uploads (`sisterroam/safety` /
 * `safety_evidence`). Evidence is admin-only (never served publicly), but this
 * freezes it too while the Cloudinary account is under review. When `true`:
 *   - the server refuses to sign / accept those uploads, and
 *   - the report form hides the evidence attachment field.
 * Safety reports still submit normally (evidence is optional).
 *
 * Flip to `false` to allow evidence attachments again.
 */
export const SAFETY_EVIDENCE_UPLOADS_ON_HOLD = true
