import { connectDB } from '@/lib/mongodb'
import SosAlert from '@/models/SosAlert'
import { ok, fail, getSession, handleError } from '@/lib/apiHelpers'

export async function POST(request) {
  try {
    await connectDB()
    const session = await getSession()
    const { alertId } = await request.json()

    if (!alertId) return fail('alertId is required', 400)

    const alert = await SosAlert.findById(alertId)
    if (!alert) return fail('Alert not found', 404)
    if (alert.userId.toString() !== session.user.id) return fail('Access denied', 403)

    alert.status      = 'cancelled'
    alert.cancelledAt = new Date()
    await alert.save()

    return ok()
  } catch (e) {
    return handleError(e)
  }
}
