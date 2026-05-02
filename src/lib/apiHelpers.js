import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'

export function ok(data = null) {
  return NextResponse.json({ success: true, data })
}

export function fail(message, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export async function getSession() {
  const session = await auth()
  if (!session?.user?.id) {
    const e = new Error('Not authenticated')
    e.status = 401
    throw e
  }
  return session
}

export async function connectAndAuth() {
  await connectDB()
  return getSession()
}

export function validateRequired(body, fields) {
  for (const f of fields) {
    const v = body[f]
    if (v === undefined || v === null || v === '') {
      const e = new Error(`${f} is required`)
      e.status = 400
      throw e
    }
  }
}

export function requireVerified(session) {
  if (session.user.verificationTier === 'basic') {
    const e = new Error('Verification required. Complete payment to unlock this feature.')
    e.status = 403
    throw e
  }
}

export function handleError(e) {
  const status = e.status ?? 500
  if (status >= 500) console.error('[API]', e)
  return NextResponse.json(
    { success: false, error: e.message ?? 'Server error' },
    { status }
  )
}
