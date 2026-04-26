import mongoose from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import SafetyCheckin from '@/models/SafetyCheckin'
import HostingRequest from '@/models/HostingRequest'
import { ok, fail, getSession, handleError } from '@/lib/apiHelpers'

export async function GET(request) {
  try {
    await connectDB()
    const session = await getSession()
    const { searchParams } = new URL(request.url)
    const requestId = searchParams.get('requestId')

    if (!requestId) return fail('requestId is required', 400)

    // Verify the user is a participant in this request
    const uid = session.user.id
    const req = await HostingRequest.findById(requestId).lean()
    if (!req) return fail('Request not found', 404)

    const isParticipant =
      req.guestId.toString() === uid ||
      req.hostId.toString()  === uid
    if (!isParticipant) return fail('Access denied', 403)

    const checkins = await SafetyCheckin.find({ requestId }).sort({ scheduledAt: 1 }).lean()
    return ok(checkins)
  } catch (e) {
    return handleError(e)
  }
}

export async function POST(request) {
  try {
    await connectDB()
    const session = await getSession()
    const { requestId } = await request.json()

    if (!requestId) return fail('requestId is required', 400)

    const req = await HostingRequest.findById(requestId).lean()
    if (!req) return fail('Request not found', 404)

    if (req.status !== 'accepted') return fail('Request must be accepted to create check-ins', 400)

    const isParticipant =
      req.guestId.toString() === session.user.id ||
      req.hostId.toString()  === session.user.id
    if (!isParticipant) return fail('Access denied', 403)

    // Check if checkins already exist for this request
    const existing = await SafetyCheckin.countDocuments({ requestId })
    if (existing > 0) return fail('Check-ins already exist for this request', 409)

    const checkIn  = new Date(req.checkInDate)
    const checkOut = new Date(req.checkOutDate)

    const arrival = new Date(checkIn)
    arrival.setUTCHours(14, 0, 0, 0)

    const morning = new Date(checkIn)
    morning.setUTCDate(morning.getUTCDate() + 1)
    morning.setUTCHours(9, 0, 0, 0)

    const departure = new Date(checkOut)
    departure.setUTCHours(10, 0, 0, 0)

    const checkins = await SafetyCheckin.insertMany([
      { requestId, userId: req.guestId, checkinType: 'arrival',   scheduledAt: arrival   },
      { requestId, userId: req.guestId, checkinType: 'morning',   scheduledAt: morning   },
      { requestId, userId: req.guestId, checkinType: 'departure', scheduledAt: departure },
    ])

    return ok(checkins)
  } catch (e) {
    return handleError(e)
  }
}
