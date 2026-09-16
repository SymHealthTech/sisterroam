import { auth } from '@/lib/auth'
import { generateUploadSignature } from '@/lib/cloudinary'
import { isVerifiedMember } from '@/lib/apiHelpers'
import { VERIFICATION_UPLOADS_ON_HOLD, PROFILE_PHOTO_UPLOADS_ON_HOLD, SAFETY_EVIDENCE_UPLOADS_ON_HOLD } from '@/lib/featureFlags'

export async function GET(request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const folder = searchParams.get('folder') ?? 'sisterroam'
    const type   = searchParams.get('type') ?? ''
    const tags   = type ? [type] : []

    // Verification media uploads are temporarily halted. Refuse to sign any
    // upload targeting the verification folder tree (ID photos + intro video)
    // so it cannot be bypassed by calling this endpoint directly.
    if (VERIFICATION_UPLOADS_ON_HOLD && folder.startsWith('sisterroam/verifications')) {
      return Response.json(
        { error: 'Identity verification is temporarily on hold. Please try again later.' },
        { status: 503 },
      )
    }

    // Profile-photo uploads are temporarily halted (public, unmoderated vector).
    if (PROFILE_PHOTO_UPLOADS_ON_HOLD && folder.startsWith('sisterroam/profiles')) {
      return Response.json(
        { error: 'Profile photo uploads are temporarily unavailable. Please try again later.' },
        { status: 503 },
      )
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

    const payload = await generateUploadSignature(folder, tags)
    return Response.json(payload)
  } catch (err) {
    console.error('[GET /api/upload/signature]:', err.message)
    return Response.json({ error: 'Failed to generate upload signature' }, { status: 500 })
  }
}
