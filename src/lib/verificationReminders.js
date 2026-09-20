import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import Payment from '@/models/Payment'
import VerificationRequest from '@/models/VerificationRequest'
import { sendMissingDocsReminderEmail } from '@/lib/resend'

/**
 * Email members who PAID for verification but never uploaded their documents.
 *
 * Eligibility (all must hold) — this mirrors the in-app "Payment received —
 * documents not uploaded" warning so we only ever nudge that exact state:
 *   - verificationTier === 'paid' (paid, still under review — not verified),
 *   - a completed `verified_badge` Payment whose paidAt is older than `hours`,
 *   - NO VerificationRequest exists (documents were never submitted),
 *   - not already reminded (verificationDocsReminderSentAt unset),
 *   - hasn't opted out of verification emails.
 *
 * Each member is emailed at most once (the sent timestamp is the guard).
 * Idempotent and safe to run repeatedly.
 *
 * @param {{ hours?: number }} [opts]
 * @returns {Promise<{ candidates: number, sent: number, skipped: number }>}
 */
export async function remindPaidMembersMissingDocs({ hours = 24 } = {}) {
  await connectDB()
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000)

  // Small set: paid members we haven't reminded yet.
  const candidates = await User.find({
    verificationTier: 'paid',
    verificationDocsReminderSentAt: { $exists: false },
  })
    .select('_id fullName email emailNotifications')
    .lean()

  let sent = 0
  let skipped = 0

  for (const u of candidates) {
    // Respect the member's verification-email preference.
    if (u.emailNotifications?.verificationUpdate === false) {
      skipped++
      continue
    }

    // Must have actually paid, and paid at least `hours` ago.
    const paid = await Payment.findOne({
      userId: u._id,
      purpose: 'verified_badge',
      status: 'completed',
      paidAt: { $lte: cutoff },
    })
      .select('_id')
      .lean()
    if (!paid) {
      skipped++
      continue
    }

    // Must have NO verification request — documents were never uploaded.
    const hasRequest = await VerificationRequest.exists({ userId: u._id })
    if (hasRequest) {
      skipped++
      continue
    }

    try {
      await sendMissingDocsReminderEmail(u)
      // Mark only after a successful send, so a failure is retried next run.
      await User.updateOne(
        { _id: u._id },
        { $set: { verificationDocsReminderSentAt: new Date() } },
      )
      sent++
    } catch (e) {
      console.error('[remindPaidMembersMissingDocs] send failed for', String(u._id), e.message)
      skipped++
    }
  }

  return { candidates: candidates.length, sent, skipped }
}
