import VerificationRequest from '@/models/VerificationRequest'
import SafetyReport from '@/models/SafetyReport'
import { ok, fail, connectAndAuth, handleError } from '@/lib/apiHelpers'

// Cache badge counts for 30s — polled by the admin nav and doesn't need
// to be real-time.
let _countsCache = null
let _countsCacheAt = 0
const COUNTS_TTL = 30_000

export async function GET() {
  try {
    const session = await connectAndAuth()
    if (!session.user.isAdmin) return fail('Admin access required', 403)

    if (_countsCache && Date.now() - _countsCacheAt < COUNTS_TTL) {
      return ok(_countsCache)
    }

    const [pendingKyc, openReports] = await Promise.all([
      VerificationRequest.countDocuments({ status: 'pending' }),
      SafetyReport.countDocuments({ status: 'open' }),
    ])

    _countsCache = { pendingKyc, openReports }
    _countsCacheAt = Date.now()

    return ok(_countsCache)
  } catch (e) {
    return handleError(e)
  }
}
