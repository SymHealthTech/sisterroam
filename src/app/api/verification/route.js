import { connectDB } from '@/lib/mongodb'
import VerificationRequest from '@/models/VerificationRequest'
import User from '@/models/User'
import { ok, fail, getSession, handleError } from '@/lib/apiHelpers'
import { sendEmail } from '@/lib/resend'
import { deleteFile } from '@/lib/cloudinary'

export async function GET(request) {
  try {
    await connectDB()
    const session = await getSession()
    if (!session.user.isAdmin) return fail('Admin access required', 403)

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit  = Math.min(100, parseInt(searchParams.get('limit') ?? '50'))

    const filter = {}
    if (status && ['pending', 'approved', 'rejected'].includes(status)) filter.status = status

    const verifications = await VerificationRequest.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('userId', 'fullName email profilePhotoUrl verificationTier')
      .lean()

    return ok({ verifications })
  } catch (e) {
    return handleError(e)
  }
}

export async function POST(request) {
  try {
    await connectDB()
    const session = await getSession()
    const body = await request.json()

    const {
      country,
      idDocumentUrl, idDocumentPublicId,
      idDocumentBackUrl, idDocumentBackPublicId,
      selfieVideoUrl, selfieVideoPublicId,
      socialMediaUrl,
    } = body

    if (country) {
      await User.findByIdAndUpdate(session.user.id, { $set: { country } })
    }

    // Before upserting, delete any Cloudinary assets that are about to be replaced.
    // Without this, every re-upload leaves orphaned files in storage.
    const existing = await VerificationRequest.findOne({ userId: session.user.id, status: 'pending' })
    if (existing) {
      const toDelete = []
      if (existing.idDocumentPublicId     && existing.idDocumentPublicId     !== idDocumentPublicId)
        toDelete.push(deleteFile(existing.idDocumentPublicId, 'image'))
      if (existing.idDocumentBackPublicId && existing.idDocumentBackPublicId !== idDocumentBackPublicId)
        toDelete.push(deleteFile(existing.idDocumentBackPublicId, 'image'))
      if (existing.selfieVideoPublicId    && existing.selfieVideoPublicId    !== selfieVideoPublicId)
        toDelete.push(deleteFile(existing.selfieVideoPublicId, 'video'))
      if (toDelete.length) await Promise.allSettled(toDelete)
    }

    // Upsert: update existing pending request or create a new one.
    const verif = await VerificationRequest.findOneAndUpdate(
      { userId: session.user.id, status: 'pending' },
      {
        $set: {
          idDocumentUrl,
          idDocumentPublicId,
          idDocumentBackUrl,
          idDocumentBackPublicId,
          selfieVideoUrl,
          selfieVideoPublicId,
          socialMediaUrl,
        },
        $setOnInsert: { userId: session.user.id },
      },
      { upsert: true, new: true },
    )

    // User-facing notification is sent by the payment/promo routes that follow this call —
    // creating one here as well would result in a duplicate in the notification panel.

    const adminEmail = process.env.ADMIN_EMAIL
    if (adminEmail) {
      sendEmail({
        to:      adminEmail,
        subject: 'New verification request – SisterRoam',
        html:    `<p>${session.user.fullName} (${session.user.id}) submitted a verification request.</p><p><a href="${process.env.NEXTAUTH_URL}/admin/kyc">Review in admin panel</a></p>`,
      }).catch(console.error)
    }

    return ok(verif.toObject())
  } catch (e) {
    return handleError(e)
  }
}
