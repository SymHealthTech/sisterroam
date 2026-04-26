import { connectDB } from '@/lib/mongodb'
import SafetyReport from '@/models/SafetyReport'
import User from '@/models/User'
import Notification from '@/models/Notification'
import { ok, fail, getSession, handleError } from '@/lib/apiHelpers'
import { sendEmail } from '@/lib/resend'

export async function GET(request) {
  try {
    await connectDB()
    const session = await getSession()
    if (!session.user.isAdmin) return fail('Admin access required', 403)

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit  = Math.min(100, parseInt(searchParams.get('limit') ?? '50'))

    const filter = {}
    if (status && ['open', 'under_review', 'resolved', 'dismissed'].includes(status)) {
      filter.status = status
    }

    const reports = await SafetyReport.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('reporterId', 'fullName email profilePhotoUrl')
      .populate('reportedUserId', 'fullName email profilePhotoUrl')
      .lean()

    return ok({ reports })
  } catch (e) {
    return handleError(e)
  }
}

export async function POST(request) {
  try {
    await connectDB()
    const session = await getSession()
    const body = await request.json()
    const { reportedUserId, requestId, reason, details, incidentDate, evidenceUrl, contactReporter } = body

    if (!reportedUserId) return fail('Reported user is required', 400)
    if (!reason)         return fail('Reason is required', 400)
    if (!details)        return fail('Details are required', 400)

    const VALID_REASONS = ['harassment', 'fake_profile', 'safety_incident', 'unwanted_contact', 'discrimination', 'other']
    if (!VALID_REASONS.includes(reason)) return fail('Invalid reason', 400)

    if (reportedUserId === session.user.id) return fail('You cannot report yourself', 400)

    const reportedUser = await User.findById(reportedUserId).select('fullName').lean()
    if (!reportedUser) return fail('Reported user not found', 404)

    const report = await SafetyReport.create({
      reporterId:     session.user.id,
      reportedUserId,
      requestId:      requestId || undefined,
      reason,
      details,
      evidenceUrl:    evidenceUrl || undefined,
      contactReporter: contactReporter !== false,
    })

    // Notify admin via email
    if (process.env.ADMIN_EMAIL) {
      sendEmail({
        to:      process.env.ADMIN_EMAIL,
        subject: `Safety Report — ${session.user.fullName} reported ${reportedUser.fullName}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2 style="color:#E24B4A">New Safety Report</h2>
            <table style="border-collapse:collapse;width:100%">
              <tr><td style="padding:6px 12px;font-weight:bold;background:#f9fafb">Reporter</td><td style="padding:6px 12px">${session.user.fullName} (ID: ${session.user.id})</td></tr>
              <tr><td style="padding:6px 12px;font-weight:bold;background:#f9fafb">Reported</td><td style="padding:6px 12px">${reportedUser.fullName} (${reportedUserId})</td></tr>
              <tr><td style="padding:6px 12px;font-weight:bold;background:#f9fafb">Reason</td><td style="padding:6px 12px">${reason.replace(/_/g, ' ')}</td></tr>
              <tr><td style="padding:6px 12px;font-weight:bold;background:#f9fafb">Details</td><td style="padding:6px 12px">${details}</td></tr>
              ${incidentDate ? `<tr><td style="padding:6px 12px;font-weight:bold;background:#f9fafb">Date</td><td style="padding:6px 12px">${incidentDate}</td></tr>` : ''}
              <tr><td style="padding:6px 12px;font-weight:bold;background:#f9fafb">Contact reporter</td><td style="padding:6px 12px">${contactReporter !== false ? 'Yes' : 'Anonymous'}</td></tr>
              ${evidenceUrl ? `<tr><td style="padding:6px 12px;font-weight:bold;background:#f9fafb">Evidence</td><td style="padding:6px 12px"><a href="${evidenceUrl}">View file</a></td></tr>` : ''}
            </table>
            <p style="margin-top:16px"><a href="${process.env.NEXTAUTH_URL}/admin/reports/${report._id}" style="color:#5D1A8B">Review report in admin panel</a></p>
          </div>
        `,
      }).catch(console.error)
    }

    return ok({ reportId: report._id.toString() })
  } catch (e) {
    return handleError(e)
  }
}
