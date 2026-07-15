import { ok, fail, connectAndAuth, handleError } from '@/lib/apiHelpers'
import { getWelcomeEnabled, setWelcomeEnabled } from '@/lib/welcomeSetting'

// GET  /api/admin/welcome-message   -> { enabled }
// DELETE                            -> disable the welcome post for everyone
// PATCH { enabled: boolean }        -> restore / toggle
// All actions are admin-only.
export async function GET() {
  try {
    const session = await connectAndAuth()
    if (!session.user.isAdmin) return fail('Admin access required', 403)
    return ok({ enabled: await getWelcomeEnabled() })
  } catch (e) {
    return handleError(e)
  }
}

export async function DELETE() {
  try {
    const session = await connectAndAuth()
    if (!session.user.isAdmin) return fail('Admin access required', 403)
    await setWelcomeEnabled(false)
    return ok({ enabled: false })
  } catch (e) {
    return handleError(e)
  }
}

export async function PATCH(request) {
  try {
    const session = await connectAndAuth()
    if (!session.user.isAdmin) return fail('Admin access required', 403)
    const { enabled } = await request.json()
    if (typeof enabled !== 'boolean') return fail('enabled must be a boolean', 400)
    await setWelcomeEnabled(enabled)
    return ok({ enabled })
  } catch (e) {
    return handleError(e)
  }
}
