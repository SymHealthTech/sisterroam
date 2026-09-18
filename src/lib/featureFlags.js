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
 *
 * 2026-09-18: RESUMED. The pipeline is hardened — documents are held on the
 * device and only uploaded AFTER the $5 payment (signature endpoints are
 * payment-gated), stored privately (authenticated), run through an NSFWJS
 * pre-filter, format-restricted and rate-limited. Payment confirmed as $5.
 */
export const VERIFICATION_UPLOADS_ON_HOLD = false

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
 *
 * 2026-09-18: RESUMED. Profile photos are now paid-members-only, run through an
 * NSFWJS pre-filter, and are held by Cloudinary manual moderation (never
 * delivered until an admin approves them), so the public/unmoderated vector is
 * closed.
 */
export const PROFILE_PHOTO_UPLOADS_ON_HOLD = false

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
 *
 * 2026-09-18: RESUMED. Evidence is admin-only, stored privately (authenticated
 * delivery, never public) and rate-limited.
 */
export const SAFETY_EVIDENCE_UPLOADS_ON_HOLD = false
