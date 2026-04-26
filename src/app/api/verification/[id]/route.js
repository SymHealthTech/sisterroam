import { connectDB } from '@/lib/mongodb'
import VerificationRequest from '@/models/VerificationRequest'
import User from '@/models/User'
import Notification from '@/models/Notification'
import { ok, fail, getSession, handleError } from '@/lib/apiHelpers'
import { sendEmail } from '@/lib/resend'

export async function PATCH(request, { params }) {
  try {
    await connectDB()
    const session = await getSession()
    if (!session.user.isAdmin) return fail('Admin access required', 403)

    const { id } = await params
    const { status, reviewerNotes } = await request.json()

    if (!['approved', 'rejected'].includes(status)) {
      return fail('Status must be "approved" or "rejected"', 400)
    }

    const verif = await VerificationRequest.findById(id)
    if (!verif) return fail('Verification request not found', 404)
    if (verif.status !== 'pending') return fail('This request has already been reviewed', 400)

    verif.status       = status
    verif.reviewerNotes = reviewerNotes ?? ''
    verif.reviewedAt   = new Date()
    verif.reviewedBy   = session.user.id
    if (status === 'rejected') verif.rejectionCount += 1
    await verif.save()

    if (status === 'approved') {
      await User.findByIdAndUpdate(verif.userId, { verificationTier: 'verified' })
    }

    const isApproved = status === 'approved'
    const notifBody  = isApproved
      ? 'Your identity has been verified. You now have a Verified badge!'
      : `Your verification was not approved.${reviewerNotes ? ` Notes: ${reviewerNotes}` : ' Please resubmit with clearer documents.'}`

    await Notification.create({
      recipientId: verif.userId,
      type:        isApproved ? 'verification_approved' : 'verification_rejected',
      title:       isApproved ? 'Identity verified!' : 'Verification update',
      body:        notifBody,
      link:        '/profile/verification',
    })

    const user = await User.findById(verif.userId).select('email fullName emailNotifications').lean()
    if (user?.emailNotifications?.verificationUpdate !== false) {
      sendEmail({
        to:      user.email,
        subject: `Verification ${status} – SisterRoam`,
        html:    `<p>Hi ${user.fullName},</p><p>${notifBody}</p>`,
      }).catch(console.error)
    }

    return ok(verif.toObject())
  } catch (e) {
    return handleError(e)
  }
}
