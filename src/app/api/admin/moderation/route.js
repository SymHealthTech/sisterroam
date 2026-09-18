import cloudinary from '@/lib/cloudinary'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import CommunityPost from '@/models/CommunityPost'
import TravelStory from '@/models/TravelStory'
import { ok, fail, getSession, handleError } from '@/lib/apiHelpers'
import { applyModerationDecision } from '@/lib/moderation'

// GET /api/admin/moderation — list images awaiting manual moderation.
// Cloudinary is the source of truth for what is pending; we enrich each asset
// with who uploaded it and where it appears.
export async function GET() {
  try {
    await connectDB()
    const session = await getSession()
    if (!session.user.isAdmin) return fail('Admin access required', 403)

    const result = await cloudinary.api.resources_by_moderation('manual', 'pending', {
      max_results: 100,
    })
    const resources = result.resources ?? []
    const ids = resources.map((r) => r.public_id)

    // Enrich with the owning record so the admin has context.
    const [users, posts, stories] = await Promise.all([
      User.find({ profilePhotoPublicId: { $in: ids } })
        .select('fullName profilePhotoPublicId')
        .lean(),
      CommunityPost.find({ imagePublicIds: { $in: ids } })
        .select('content imagePublicIds authorId')
        .populate('authorId', 'fullName')
        .lean(),
      TravelStory.find({ coverImagePublicId: { $in: ids } })
        .select('title slug coverImagePublicId authorId')
        .populate('authorId', 'fullName')
        .lean(),
    ])

    const meta = new Map()
    for (const u of users) {
      meta.set(u.profilePhotoPublicId, { kind: 'profile_photo', owner: u.fullName, context: 'Profile photo' })
    }
    for (const p of posts) {
      for (const id of p.imagePublicIds ?? []) {
        if (ids.includes(id)) {
          meta.set(id, {
            kind: 'community_image',
            owner: p.authorId?.fullName ?? 'Unknown',
            context: `Community post: “${(p.content ?? '').slice(0, 60)}”`,
          })
        }
      }
    }
    for (const s of stories) {
      meta.set(s.coverImagePublicId, {
        kind: 'story_cover',
        owner: s.authorId?.fullName ?? 'Unknown',
        context: `Story cover: “${s.title}”`,
      })
    }

    const items = resources.map((r) => ({
      publicId: r.public_id,
      url: r.secure_url,
      width: r.width,
      height: r.height,
      bytes: r.bytes,
      createdAt: r.created_at,
      resourceType: r.resource_type,
      ...(meta.get(r.public_id) ?? { kind: 'unknown', owner: 'Unknown', context: 'Unlinked asset' }),
    }))

    return ok({ items })
  } catch (e) {
    return handleError(e)
  }
}

// POST /api/admin/moderation — approve or reject one asset.
// Body: { publicId, action: 'approve' | 'reject' }
export async function POST(request) {
  try {
    await connectDB()
    const session = await getSession()
    if (!session.user.isAdmin) return fail('Admin access required', 403)

    const { publicId, action } = await request.json()
    if (!publicId || !['approve', 'reject'].includes(action)) {
      return fail('publicId and a valid action are required', 400)
    }

    const status = action === 'approve' ? 'approved' : 'rejected'

    // Tell Cloudinary — approved assets start delivering; rejected stay blocked.
    await cloudinary.api.update(publicId, { moderation_status: status })

    // Sync our own DB immediately (the webhook will also fire, idempotently).
    const res = await applyModerationDecision(publicId, status, 'image')

    return ok({ publicId, status, matched: res.matched })
  } catch (e) {
    return handleError(e)
  }
}
