import mongoose from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import HostingRequest from '@/models/HostingRequest'
import Message from '@/models/Message'
import { ok, getSession, handleError } from '@/lib/apiHelpers'

export async function GET() {
  try {
    await connectDB()
    const session = await getSession()
    const uid = new mongoose.Types.ObjectId(session.user.id)

    const requests = await HostingRequest.find({
      $or: [{ guestId: uid }, { hostId: uid }],
    }).select('_id').lean()

    const requestIds = requests.map(r => r._id)

    const count = await Message.countDocuments({
      requestId: { $in: requestIds },
      senderId:  { $ne: uid },
      isRead:    false,
    })

    return ok({ count })
  } catch (e) {
    return handleError(e)
  }
}
