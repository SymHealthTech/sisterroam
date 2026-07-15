import User from '@/models/User'
import { ok, connectAndAuth, handleError } from '@/lib/apiHelpers'

// Escape a user-supplied string for safe use inside a RegExp
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// GET /api/users/sisters
//   ?q=      optional search string (matches name / username / initials)
//   ?limit=  page size (default 30, max 60)
//   ?skip=   offset for pagination
// Returns { sisters: [...], total } sorted newest-joined first.
export async function GET(request) {
  try {
    const session = await connectAndAuth()
    // Any signed-in sister may view/search all signed-up sisters, irrespective of tier.

    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim()
    const limit = Math.min(parseInt(searchParams.get('limit') || '30', 10) || 30, 60)
    const skip = Math.max(parseInt(searchParams.get('skip') || '0', 10) || 0, 0)

    // Match every signed-up sister (all verification tiers), excluding only
    // inactive / suspended / banned accounts. This base filter INCLUDES the
    // viewer herself and drives the displayed "total sisters" count.
    const filter = {
      isActive: true,
      isSuspended: { $ne: true },
      isPermanentlyBanned: { $ne: true },
    }

    if (q) {
      const safe = escapeRegex(q)
      const conditions = [
        { fullName: { $regex: safe, $options: 'i' } },
        { username: { $regex: safe, $options: 'i' } },
      ]
      // Initials search: "ab" -> matches "Alice Brown" (each letter starts a word)
      const letters = q.replace(/[^a-zA-Z]/g, '')
      if (letters.length >= 2) {
        const initialsPattern =
          '\\b' + letters.split('').map(escapeRegex).join('[a-zA-Z]*\\s+')
        conditions.push({ fullName: { $regex: initialsPattern, $options: 'i' } })
      }
      filter.$or = conditions
    }

    // The list itself excludes the viewer so she doesn't see her own profile.
    const listFilter = { ...filter, _id: { $ne: session.user.id } }

    const [sisters, listTotal, total] = await Promise.all([
      User.find(listFilter)
        .select(
          'fullName username profilePhotoUrl city country role countriesVisited travellerCategories verificationTier createdAt',
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(listFilter),
      User.countDocuments(filter),
    ])

    // total    -> full count incl. viewer (shown to the user)
    // listTotal -> count of listed rows excl. viewer (drives pagination)
    return ok({ sisters, total, listTotal })
  } catch (e) {
    return handleError(e)
  }
}
