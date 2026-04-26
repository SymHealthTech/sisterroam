import SafetyReport from '@/models/SafetyReport'
import { ok, fail, connectAndAuth, handleError } from '@/lib/apiHelpers'

const VALID_STATUSES  = ['under_review', 'resolved', 'dismissed']
const VALID_ACTIONS   = ['warning', 'suspension_7', 'suspension_30', 'permanent_ban', 'no_action']

export async function PATCH(request, { params }) {
  try {
    const session = await connectAndAuth()
    if (!session.user.isAdmin) return fail('Admin access required', 403)

    const { id } = await params
    const { status, actionTaken, adminNotes } = await request.json()

    if (status && !VALID_STATUSES.includes(status)) return fail('Invalid status', 400)
    if (actionTaken && !VALID_ACTIONS.includes(actionTaken)) return fail('Invalid action', 400)

    const report = await SafetyReport.findById(id)
    if (!report) return fail('Report not found', 404)

    if (status)      report.status     = status
    if (adminNotes !== undefined) report.adminNotes = adminNotes
    if (actionTaken) report.actionTaken = actionTaken

    if (status === 'resolved' || status === 'dismissed') {
      report.resolvedAt = new Date()
      report.resolvedBy = session.user.id
    }

    await report.save()
    return ok(report.toObject())
  } catch (e) {
    return handleError(e)
  }
}
