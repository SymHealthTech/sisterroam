import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { remindPaidMembersMissingDocs } from '@/lib/verificationReminders'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Daily job (Vercel Cron) — email members who paid but never uploaded their
// verification documents (see remindPaidMembersMissingDocs for eligibility).
//
// Auth: Vercel Cron sends `Authorization: Bearer $CRON_SECRET` when CRON_SECRET
// is configured. An admin session may also trigger it manually. If no secret is
// set, the endpoint is left open — it is idempotent and only ever sends each
// member one reminder — but setting CRON_SECRET is strongly recommended.
async function authorize(request) {
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`) {
    return true
  }
  try {
    const session = await auth()
    if (session?.user?.isAdmin) return true
  } catch {
    /* not signed in — fall through */
  }
  return !process.env.CRON_SECRET
}

export async function GET(request) {
  if (!(await authorize(request))) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const result = await remindPaidMembersMissingDocs({ hours: 24 })
    return NextResponse.json({ success: true, ...result })
  } catch (e) {
    console.error('[cron/verification-docs-reminder]', e)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
