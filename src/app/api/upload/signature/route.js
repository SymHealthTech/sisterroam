import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import Payment from '@/models/Payment'
import { generateUploadSignature } from '@/lib/cloudinary'
import { isVerifiedMember } from '@/lib/apiHelpers'
import { checkRateLimit } from '@/lib/rateLimit'
import { VERIFICATION_UPLOADS_ON_HOLD, PROFILE_PHOTO_UPLOADS_ON_HOLD, SAFETY_EVIDENCE_UPLOADS_ON_HOLD } from '@/lib/featureFlags'

export async function GET(request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    // Throttle upload-signature requests per member (defence against a
    // compromised/automated client dumping many files quickly).
    const rl = await checkRateLimit(`upload-sig:${session.user.id}`, {
      max: 60,
      windowMs: 60 * 60 * 1000, // 60 uploads/hour
    })
    if (!rl.allowed) {
      return Response.json(
        { error: 'Too many uploads in a short time. Please try again later.' },
        { status: 429 },
      )
    }

    const { searchParams } = new URL(request.url)
    const folder = searchParams.get('folder') ?? 'sisterroam'
    const type   = searchParams.get('type') ?? ''
    const tags   = type ? [type] : []

    // Verification media (ID photos + intro video). Gated so it cannot be
    // bypassed by calling this endpoint directly:
    //   1. If uploads are on hold, refuse outright.
    //   2. Otherwise require a COMPLETED verification payment first — media only
    //      reaches Cloudinary after the member has paid (kills throwaway-account
    //      abuse economics).
    if (folder.startsWith('sisterroam/verifications')) {
      if (VERIFICATION_UPLOADS_ON_HOLD) {
        return Response.json(
          { error: 'Identity verification is temporarily on hold. Please try again later.' },
          { status: 503 },
        )
      }
      await connectDB()
      const paid = await Payment.findOne({
        userId: session.user.id,
        purpose: 'verified_badge',
        status: 'completed',
      })
      if (!paid) {
        return Response.json(
          { error: 'Please complete the verification payment before uploading your documents.' },
          { status: 403 },
        )
      }
    }

    // Profile photos: on hold → refuse; otherwise members who have paid the
    // verification fee (paid/verified/trusted — i.e. not free 'basic' accounts).
    // Every photo is still manually moderated, so nothing is public until an
    // admin approves it — the paywall + moderation together remove the abuse risk.
    if (folder.startsWith('sisterroam/profiles')) {
      if (PROFILE_PHOTO_UPLOADS_ON_HOLD) {
        return Response.json(
          { error: 'Profile photo uploads are temporarily unavailable. Please try again later.' },
          { status: 503 },
        )
      }
      if (session.user.verificationTier === 'basic') {
        return Response.json(
          { error: 'Please complete verification before adding a profile photo.' },
          { status: 403 },
        )
      }
    }

    // Safety-report evidence uploads are temporarily halted.
    if (SAFETY_EVIDENCE_UPLOADS_ON_HOLD && folder.startsWith('sisterroam/safety')) {
      return Response.json(
        { error: 'Evidence uploads are temporarily unavailable. Please submit your report without an attachment.' },
        { status: 503 },
      )
    }

    // Only verified members may upload member-generated photos
    // (community/feed images and travel-story covers).
    if (
      (folder.startsWith('sisterroam/community') || folder.startsWith('sisterroam/stories')) &&
      !isVerifiedMember(session)
    ) {
      return Response.json(
        { error: 'Only verified members can upload photos.' },
        { status: 403 },
      )
    }

    // Choose the extra signed upload params by destination:
    //  • Public images (profiles / community / stories) get manual moderation —
    //    Cloudinary holds them 'pending' and never delivers them until an admin
    //    approves them, so an unmoderated image can never be served publicly.
    //  • Verification media is stored 'authenticated' (private) — only reachable
    //    through short-lived signed URLs the admin KYC screen generates.
    //  • allowed_formats is signed too, so Cloudinary rejects anything that
    //    isn't a real image/video (defence against disguised/oversized payloads).
    const isPublicImage =
      folder.startsWith('sisterroam/profiles') ||
      folder.startsWith('sisterroam/community') ||
      folder.startsWith('sisterroam/stories')
    const isVerification = folder.startsWith('sisterroam/verifications')
    const isVideoFolder = folder.startsWith('sisterroam/verifications/videos')

    const extra = {}
    if (isPublicImage) extra.moderation = 'manual'
    else if (isVerification) extra.type = 'authenticated'

    if (isVideoFolder) {
      extra.allowed_formats = 'mp4,mov,webm,avi,m4v'
    } else if (isPublicImage || isVerification) {
      extra.allowed_formats = 'jpg,jpeg,png,webp,heic,heif'
    }

    const payload = await generateUploadSignature(folder, tags, extra)
    return Response.json(payload)
  } catch (err) {
    console.error('[GET /api/upload/signature]:', err.message)
    return Response.json({ error: 'Failed to generate upload signature' }, { status: 500 })
  }
}
