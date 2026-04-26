import { connectDB } from '@/lib/mongodb'
import SosAlert from '@/models/SosAlert'
import HostingRequest from '@/models/HostingRequest'
import User from '@/models/User'
import { ok, fail, getSession, handleError } from '@/lib/apiHelpers'
import { sendEmail } from '@/lib/resend'

export async function POST(request) {
  try {
    await connectDB()
    const session = await getSession()
    const { coordinates, requestId } = await request.json()

    const user = await User.findById(session.user.id)
      .select('fullName email phone emergencyContactName emergencyContactPhone emergencyContactEmail emergencyContactRelationship')
      .lean()

    let hostInfo = null
    if (requestId) {
      const req = await HostingRequest.findById(requestId)
        .populate('hostId', 'fullName phone')
        .lean()
      if (req) hostInfo = req.hostId
    }

    const alert = await SosAlert.create({
      userId:    session.user.id,
      requestId: requestId || undefined,
      coordinates: coordinates || undefined,
    })

    const locationText = coordinates
      ? `<a href="https://maps.google.com/?q=${coordinates.lat},${coordinates.lng}" style="color:#E24B4A">View location on Google Maps</a>`
      : '<em>Location not available</em>'

    // Email to emergency contact if they have an email on file
    if (user.emergencyContactEmail) {
      sendEmail({
        to:      user.emergencyContactEmail,
        subject: `EMERGENCY — ${user.fullName} activated SOS on SisterRoam`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2 style="color:#E24B4A">🆘 Emergency Alert</h2>
            <p><strong>${user.fullName}</strong> has activated the SOS emergency button on SisterRoam.</p>
            <p><strong>Location:</strong> ${locationText}</p>
            ${hostInfo ? `<p><strong>Currently staying with:</strong> ${hostInfo.fullName}${hostInfo.phone ? ` / ${hostInfo.phone}` : ''}</p>` : ''}
            <p>Please contact them immediately or call emergency services if needed.</p>
            <p style="color:#999;font-size:12px">This is an automated alert from SisterRoam safety system.</p>
          </div>
        `,
      }).catch(console.error)
    }

    // Email to admin
    if (process.env.ADMIN_EMAIL) {
      sendEmail({
        to:      process.env.ADMIN_EMAIL,
        subject: `🆘 SOS ACTIVATED — ${user.fullName}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2 style="color:#E24B4A">SOS Alert Activated</h2>
            <table style="border-collapse:collapse;width:100%">
              <tr><td style="padding:6px 12px;font-weight:bold;background:#f9fafb">User</td><td style="padding:6px 12px">${user.fullName} / ${user.email}${user.phone ? ` / ${user.phone}` : ''}</td></tr>
              <tr><td style="padding:6px 12px;font-weight:bold;background:#f9fafb">Location</td><td style="padding:6px 12px">${locationText}</td></tr>
              ${hostInfo ? `<tr><td style="padding:6px 12px;font-weight:bold;background:#f9fafb">Active stay</td><td style="padding:6px 12px">${hostInfo.fullName}${hostInfo.phone ? ` / ${hostInfo.phone}` : ''}</td></tr>` : ''}
              <tr><td style="padding:6px 12px;font-weight:bold;background:#f9fafb">Emergency contact</td><td style="padding:6px 12px">${user.emergencyContactName || 'Not set'}${user.emergencyContactPhone ? ` / ${user.emergencyContactPhone}` : ''}</td></tr>
              <tr><td style="padding:6px 12px;font-weight:bold;background:#f9fafb">Time</td><td style="padding:6px 12px">${new Date().toISOString()}</td></tr>
            </table>
          </div>
        `,
      }).catch(console.error)
    }

    return ok({ alertId: alert._id.toString() })
  } catch (e) {
    return handleError(e)
  }
}
