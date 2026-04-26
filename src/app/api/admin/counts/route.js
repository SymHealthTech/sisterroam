import VerificationRequest from '@/models/VerificationRequest'
import SafetyReport from '@/models/SafetyReport'
import { ok, fail, connectAndAuth, handleError } from '@/lib/apiHelpers'

export async function GET() {
  try {
    const session = await connectAndAuth()
    if (!session.user.isAdmin) return fail('Admin access required', 403)

    const [pendingKyc, openReports] = await Promise.all([
      VerificationRequest.countDocuments({ status: 'pending' }),
      SafetyReport.countDocuments({ status: 'open' }),
    ])

    return ok({ pendingKyc, openReports })
  } catch (e) {
    return handleError(e)
  }
}
