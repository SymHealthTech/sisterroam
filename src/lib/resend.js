import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export default resend

export async function sendEmail({ to, subject, html }) {
  return resend.emails.send({
    from: 'SisterRoam <noreply@sisterroam.com>',
    to,
    subject,
    html,
  })
}

export async function sendOtpEmail({ to, otp }) {
  return sendEmail({
    to,
    subject: 'Your SisterRoam verification code',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#5D1A8B">Verify your email</h2>
        <p>Your verification code is:</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#5D1A8B;margin:24px 0">${otp}</div>
        <p>This code expires in 10 minutes.</p>
        <p style="color:#999;font-size:12px">If you didn't request this, please ignore this email.</p>
      </div>
    `,
  })
}
